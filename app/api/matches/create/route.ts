import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { matches, messages, users, skills, startupIdeas } from '@/drizzle/schema';
import { eq, or, and } from 'drizzle-orm';
import { generateId } from '@/lib/utils';
import { generateIntroMessage } from '@/lib/intro-message';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (session.user.id === userId) {
      return NextResponse.json(
        { error: 'Cannot create match with yourself' },
        { status: 400 }
      );
    }

    // Check if match already exists
    const existingMatch = await db.select().from(matches)
      .where(or(
        and(
          eq(matches.user1Id, session.user.id),
          eq(matches.user2Id, userId)
        ),
        and(
          eq(matches.user1Id, userId),
          eq(matches.user2Id, session.user.id)
        )
      ))
      .limit(1);

    if (existingMatch.length > 0) {
      // Check if intro message already exists
      const existingMessages = await db.select().from(messages)
        .where(eq(messages.matchId, existingMatch[0].id))
        .limit(1);

      if (existingMessages.length === 0) {
        // Create intro message
        await createIntroMessage(existingMatch[0].id, session.user.id, userId);
      }

      return NextResponse.json({
        id: existingMatch[0].id,
        created: false,
      });
    }

    // Create new match
    const matchId = generateId();
    await db.insert(matches).values({
      id: matchId,
      user1Id: session.user.id,
      user2Id: userId,
      matchScore: null,
    });

    // Create intro message
    await createIntroMessage(matchId, session.user.id, userId);

    return NextResponse.json({
      id: matchId,
      created: true,
    });
  } catch (error) {
    console.error('Create match error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createIntroMessage(matchId: string, currentUserId: string, otherUserId: string) {
  try {
    const [currentUserData, otherUserData] = await Promise.all([
      // Get current user data
      Promise.all([
        db.select().from(users).where(eq(users.id, currentUserId)).limit(1),
        db.select().from(skills).where(eq(skills.userId, currentUserId)),
        db.select().from(startupIdeas).where(eq(startupIdeas.userId, currentUserId)),
      ]),
      // Get other user data
      Promise.all([
        db.select().from(users).where(eq(users.id, otherUserId)).limit(1),
        db.select().from(skills).where(eq(skills.userId, otherUserId)),
        db.select().from(startupIdeas).where(eq(startupIdeas.userId, otherUserId)),
      ]),
    ]);

    const currentUser = currentUserData[0][0];
    const currentUserSkills = currentUserData[1];
    const currentUserIdeas = currentUserData[2];
    const otherUser = otherUserData[0][0];
    const otherUserSkills = otherUserData[1];
    const otherUserIdeas = otherUserData[2];

    if (currentUser && otherUser) {
      // Try to get ML match data if available
      let matchCharacteristics: string[] = [];
      try {
        const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
        const mlResponse = await fetch(`${mlServiceUrl}/api/v1/matches`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target_user: {
              user_id: currentUserId,
              idea: currentUserIdeas.map(i => `${i.title}: ${i.description}`).join('. ') || 'Looking for opportunities',
              skills: currentUserSkills.map(s => s.skillName),
            },
            candidate_users: [{
              user_id: otherUserId,
              idea: otherUserIdeas.map(i => `${i.title}: ${i.description}`).join('. ') || 'Looking for opportunities',
              skills: otherUserSkills.map(s => s.skillName),
            }],
            top_k: 1,
          }),
        });
        if (mlResponse.ok) {
          const mlData = await mlResponse.json();
          if (mlData.matches && mlData.matches.length > 0) {
            matchCharacteristics = mlData.matches[0].match_characteristics || [];
          }
        }
      } catch (mlError) {
        // ML service not available, continue without it
      }

      const introMessage = generateIntroMessage({
        currentUser: {
          name: currentUser.name,
          skills: currentUserSkills.map(s => ({
            skillName: s.skillName,
            proficiencyLevel: s.proficiencyLevel,
          })),
          ideas: currentUserIdeas.map(i => ({
            title: i.title,
            description: i.description,
            industry: i.industry,
          })),
        },
        otherUser: {
          name: otherUser.name,
          skills: otherUserSkills.map(s => ({
            skillName: s.skillName,
            proficiencyLevel: s.proficiencyLevel,
          })),
          ideas: otherUserIdeas.map(i => ({
            title: i.title,
            description: i.description,
            industry: i.industry,
          })),
        },
        matchCharacteristics,
      });

      // Create intro message
      const messageId = generateId();
      await db.insert(messages).values({
        id: messageId,
        matchId,
        senderId: currentUserId,
        content: introMessage,
        read: false,
      });

      // Update match last_message_at
      await db.update(matches)
        .set({ lastMessageAt: new Date() })
        .where(eq(matches.id, matchId));
    }
  } catch (error) {
    console.error('Error creating intro message:', error);
    // Don't fail match creation if message creation fails
  }
}

