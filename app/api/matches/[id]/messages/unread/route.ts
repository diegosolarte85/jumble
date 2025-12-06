import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { messages, matches } from '@/drizzle/schema';
import { eq, or, and, ne } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const matchId = params.id;

    // Verify the match belongs to the user
    const match = await db.select().from(matches)
      .where(and(
        eq(matches.id, matchId),
        or(
          eq(matches.user1Id, session.user.id),
          eq(matches.user2Id, session.user.id)
        )
      ))
      .limit(1);

    if (!match[0]) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Get unread messages NOT sent by current user
    const unreadMessages = await db.select().from(messages)
      .where(and(
        eq(messages.matchId, matchId),
        eq(messages.read, false),
        ne(messages.senderId, session.user.id)
      ));

    return NextResponse.json({ unread: unreadMessages.length });
  } catch (error) {
    console.error('Get unread count error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

