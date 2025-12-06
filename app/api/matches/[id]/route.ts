import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { matches, users } from '@/drizzle/schema';
import { eq, or, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

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

    const otherUserId = match[0].user1Id === session.user.id ? match[0].user2Id : match[0].user1Id;
    const otherUser = await db.select().from(users)
      .where(eq(users.id, otherUserId))
      .limit(1);

    const otherUserData = otherUser[0];
    return NextResponse.json({
      ...match[0],
      otherUser: otherUserData ? {
        id: otherUserData.id,
        name: otherUserData.name,
        bio: otherUserData.bio,
        location: otherUserData.location,
        profilePicture: otherUserData.profilePicture || null,
        commitmentLevel: otherUserData.commitmentLevel,
      } : null,
    });
  } catch (error) {
    console.error('Get match error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await db.delete(matches).where(eq(matches.id, matchId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unmatch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

