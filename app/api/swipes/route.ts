import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { swipes, matches } from '@/drizzle/schema';
import { eq, and, or } from 'drizzle-orm';
import { generateId } from '@/lib/utils';

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

