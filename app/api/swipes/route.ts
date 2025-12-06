import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { swipes, matches, messages, users, skills, startupIdeas } from '@/drizzle/schema';
import { eq, and, or } from 'drizzle-orm';
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
    const { swipedId, direction } = body;

    if (!swipedId || !direction) {
      return NextResponse.json(
        { error: 'swipedId and direction are required' },
        { status: 400 }
      );
    }

    if (!['left', 'right', 'super'].includes(direction)) {
      return NextResponse.json(
        { error: 'Invalid direction' },
        { status: 400 }
      );
    }

    if (session.user.id === swipedId) {
      return NextResponse.json(
        { error: 'Cannot swipe on yourself' },
        { status: 400 }
      );
    }

    // Check if swipe already exists
    const existingSwipe = await db.select().from(swipes)
      .where(and(
        eq(swipes.swiperId, session.user.id),
        eq(swipes.swipedId, swipedId)
      ))
      .limit(1);

    if (existingSwipe.length > 0) {
      return NextResponse.json(
        { error: 'Already swiped on this user' },
        { status: 400 }
      );
    }

    // Record swipe
    const swipeId = generateId();
    await db.insert(swipes).values({
      id: swipeId,
      swiperId: session.user.id,
      swipedId,
      direction,
    });

    // Check for mutual match (both users swiped right or super)
    if (direction === 'right' || direction === 'super') {
      const mutualSwipe = await db.select().from(swipes)
        .where(and(
          eq(swipes.swiperId, swipedId),
          eq(swipes.swipedId, session.user.id),
          eq(swipes.direction, 'right')
        ))
        .limit(1);

      if (mutualSwipe.length > 0 || direction === 'super') {
        // Check if match already exists to prevent duplicates
        const existingMatch = await db.select().from(matches)
          .where(or(
            and(
              eq(matches.user1Id, session.user.id),
              eq(matches.user2Id, swipedId)
            ),
            and(
              eq(matches.user1Id, swipedId),
              eq(matches.user2Id, session.user.id)
            )
          ))
          .limit(1);

        if (existingMatch.length === 0) {
          // Create match only if it doesn't exist
          const matchId = generateId();
          await db.insert(matches).values({
            id: matchId,
            user1Id: session.user.id,
            user2Id: swipedId,
            matchScore: null, // Will be calculated by ML service
          });

          // Generate and create intro message from current user
          try {
            const [currentUserData, otherUserData] = await Promise.all([
              // Get current user data
              Promise.all([
                db.select().from(users).where(eq(users.id, session.user.id)).limit(1),
                db.select().from(skills).where(eq(skills.userId, session.user.id)),
                db.select().from(startupIdeas).where(eq(startupIdeas.userId, session.user.id)),
              ]),
              // Get other user data
              Promise.all([
                db.select().from(users).where(eq(users.id, swipedId)).limit(1),
                db.select().from(skills).where(eq(skills.userId, swipedId)),
                db.select().from(startupIdeas).where(eq(startupIdeas.userId, swipedId)),
              ]),
            ]);

            const currentUser = currentUserData[0][0];
            const currentUserSkills = currentUserData[1];
            const currentUserIdeas = currentUserData[2];
            const otherUser = otherUserData[0][0];
            const otherUserSkills = otherUserData[1];
            const otherUserIdeas = otherUserData[2];

            if (currentUser && otherUser) {
              // Try to get ML match data if available (for better intro message)
              let matchCharacteristics: string[] = [];
              try {
                const mlResponse = await fetch(`${process.env.ML_SERVICE_URL || 'http://localhost:8000'}/api/v1/matches`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    target_user: {
                      user_id: session.user.id,
                      idea: currentUserIdeas.map(i => `${i.title}: ${i.description}`).join('. ') || 'Looking for opportunities',
                      skills: currentUserSkills.map(s => s.skillName),
                    },
                    candidate_users: [{
                      user_id: swipedId,
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
                senderId: session.user.id,
                content: introMessage,
                read: false,
              });

              // Update match last_message_at
              await db.update(matches)
                .set({ lastMessageAt: new Date() })
                .where(eq(matches.id, matchId));
            }
          } catch (msgError) {
            console.error('Error creating intro message:', msgError);
            // Don't fail the swipe if message creation fails
          }

          return NextResponse.json({
            swipe: { id: swipeId, swipedId, direction },
            match: { id: matchId, matched: true },
          });
        } else {
          // Match already exists
          return NextResponse.json({
            swipe: { id: swipeId, swipedId, direction },
            match: { id: existingMatch[0].id, matched: true },
          });
        }
      }
    }

    return NextResponse.json({
      swipe: { id: swipeId, swipedId, direction },
      match: { matched: false },
    });
  } catch (error) {
    console.error('Swipe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const swipeHistory = await db.select().from(swipes)
      .where(eq(swipes.swiperId, session.user.id));

    return NextResponse.json(swipeHistory);
  } catch (error) {
    console.error('Get swipe history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

