import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, swipes, startupIdeas, skills } from '@/drizzle/schema';
import { eq, notInArray, and, ne } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get users that the current user hasn't swiped on yet
    const userSwipes = await db.select().from(swipes)
      .where(eq(swipes.swiperId, session.user.id));

    const swipedUserIds = userSwipes.map(swipe => swipe.swipedId);
    swipedUserIds.push(session.user.id); // Exclude self

    // Get all other users (excluding already swiped and self)
    const potentialMatches = await db.select().from(users)
      .where(notInArray(users.id, swipedUserIds.length > 0 ? swipedUserIds : [session.user.id]));

    // For MVP, return basic recommendations
    // In Phase 2, this will integrate with ML service for intelligent matching
    const recommendations = await Promise.all(
      potentialMatches.slice(0, 50).map(async (user) => {
        const userSkills = await db.select().from(skills)
          .where(eq(skills.userId, user.id));
        
        const userIdeas = await db.select().from(startupIdeas)
          .where(eq(startupIdeas.userId, user.id));

        return {
          id: user.id,
          name: user.name,
          bio: user.bio,
          location: user.location,
          profilePicture: user.profilePicture || null,
          commitmentLevel: user.commitmentLevel,
          skills: userSkills.map(s => ({
            skillName: s.skillName,
            proficiencyLevel: s.proficiencyLevel,
          })),
          ideas: userIdeas.map(i => ({
            id: i.id,
            title: i.title,
            description: i.description,
            industry: i.industry,
            stage: i.stage,
          })),
        };
      })
    );

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Get recommendations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

