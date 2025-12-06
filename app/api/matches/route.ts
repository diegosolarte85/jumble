import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { matches, users } from '@/drizzle/schema';
import { eq, or } from 'drizzle-orm';

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

    const userMatches = await db.select().from(matches)
      .where(or(
        eq(matches.user1Id, session.user.id),
        eq(matches.user2Id, session.user.id)
      ));

    // Get user details for each match
    const matchesWithUsers = await Promise.all(
      userMatches.map(async (match) => {
        const otherUserId = match.user1Id === session.user.id ? match.user2Id : match.user1Id;
        const otherUser = await db.select().from(users)
          .where(eq(users.id, otherUserId))
          .limit(1);

        return {
          ...match,
          otherUser: otherUser[0] ? {
            id: otherUser[0].id,
            name: otherUser[0].name,
            bio: otherUser[0].bio,
            location: otherUser[0].location,
            commitmentLevel: otherUser[0].commitmentLevel,
          } : null,
        };
      })
    );

    return NextResponse.json(matchesWithUsers);
  } catch (error) {
    console.error('Get matches error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

