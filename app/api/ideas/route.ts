import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { startupIdeas } from '@/drizzle/schema';
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
    const { title, description, industry, requiredSkills, stage } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const ideaId = generateId();
    const newIdea = {
      id: ideaId,
      userId: session.user.id,
      title,
      description,
      industry: industry || null,
      requiredSkills: requiredSkills ? JSON.stringify(requiredSkills) : null,
      ideaEmbedding: null, // Will be populated by ML service
      stage: stage || 'idea',
    };

    await db.insert(startupIdeas).values(newIdea);

    return NextResponse.json(newIdea, { status: 201 });
  } catch (error) {
    console.error('Create idea error:', error);
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

