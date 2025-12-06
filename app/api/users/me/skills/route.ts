import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { skills } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
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
    const { skillName, proficiencyLevel } = body;

    if (!skillName || !proficiencyLevel) {
      return NextResponse.json(
        { error: 'skillName and proficiencyLevel are required' },
        { status: 400 }
      );
    }

    if (!['beginner', 'intermediate', 'expert'].includes(proficiencyLevel)) {
      return NextResponse.json(
        { error: 'Invalid proficiency level' },
        { status: 400 }
      );
    }

    const skillId = generateId();
    const newSkill = {
      id: skillId,
      userId: session.user.id,
      skillName,
      proficiencyLevel,
      skillEmbedding: null, // Will be populated by ML service
    };

    await db.insert(skills).values(newSkill);

    return NextResponse.json(newSkill, { status: 201 });
  } catch (error) {
    console.error('Add skill error:', error);
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

    const userSkills = await db.select().from(skills).where(eq(skills.userId, session.user.id));

    return NextResponse.json(userSkills);
  } catch (error) {
    console.error('Get skills error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

