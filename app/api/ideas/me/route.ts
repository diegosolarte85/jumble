import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { startupIdeas } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

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

    const userIdeas = await db.select().from(startupIdeas).where(eq(startupIdeas.userId, session.user.id));

    return NextResponse.json(userIdeas.map(idea => ({
      ...idea,
      requiredSkills: idea.requiredSkills ? JSON.parse(idea.requiredSkills) : null,
    })));
  } catch (error) {
    console.error('Get ideas error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

