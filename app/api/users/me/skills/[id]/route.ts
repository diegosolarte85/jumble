import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { skills } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

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

    const skillId = params.id;

    // Verify the skill belongs to the user
    const skill = await db.select().from(skills)
      .where(and(eq(skills.id, skillId), eq(skills.userId, session.user.id)))
      .limit(1);

    if (!skill[0]) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    await db.delete(skills).where(eq(skills.id, skillId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete skill error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

