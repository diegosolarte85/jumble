import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { messages, matches } from '@/drizzle/schema';
import { eq, or, and, ne } from 'drizzle-orm';

export async function PUT(
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

    // Mark all unread messages as read (messages not sent by current user)
    await db.update(messages)
      .set({ read: true })
      .where(and(
        eq(messages.matchId, matchId),
        eq(messages.read, false),
        ne(messages.senderId, session.user.id)
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

