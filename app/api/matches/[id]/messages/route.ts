import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { messages, matches } from '@/drizzle/schema';
import { eq, or, and, desc } from 'drizzle-orm';
import { generateId } from '@/lib/utils';

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

    const matchMessages = await db.select().from(messages)
      .where(eq(messages.matchId, matchId))
      .orderBy(desc(messages.createdAt));

    return NextResponse.json(matchMessages);
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

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

    // Create message
    const messageId = generateId();
    await db.insert(messages).values({
      id: messageId,
      matchId,
      senderId: session.user.id,
      content: content.trim(),
      read: false,
    });

    // Update match last_message_at
    await db.update(matches)
      .set({ lastMessageAt: new Date() })
      .where(eq(matches.id, matchId));

    const newMessage = await db.select().from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    return NextResponse.json(newMessage[0], { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

