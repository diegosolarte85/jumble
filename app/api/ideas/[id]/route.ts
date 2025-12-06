import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { startupIdeas } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ideaId = params.id;

    const idea = await db.select().from(startupIdeas).where(eq(startupIdeas.id, ideaId)).limit(1);

    if (!idea[0]) {
      return NextResponse.json(
        { error: 'Idea not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...idea[0],
      requiredSkills: idea[0].requiredSkills ? JSON.parse(idea[0].requiredSkills) : null,
    });
  } catch (error) {
    console.error('Get idea error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const ideaId = params.id;
    const body = await request.json();

    // Verify the idea belongs to the user
    const idea = await db.select().from(startupIdeas)
      .where(and(eq(startupIdeas.id, ideaId), eq(startupIdeas.userId, session.user.id)))
      .limit(1);

    if (!idea[0]) {
      return NextResponse.json(
        { error: 'Idea not found' },
        { status: 404 }
      );
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.industry !== undefined) updateData.industry = body.industry;
    if (body.requiredSkills !== undefined) updateData.requiredSkills = JSON.stringify(body.requiredSkills);
    if (body.stage !== undefined) updateData.stage = body.stage;

    await db.update(startupIdeas)
      .set(updateData)
      .where(eq(startupIdeas.id, ideaId));

    const updatedIdea = await db.select().from(startupIdeas).where(eq(startupIdeas.id, ideaId)).limit(1);

    return NextResponse.json({
      ...updatedIdea[0],
      requiredSkills: updatedIdea[0].requiredSkills ? JSON.parse(updatedIdea[0].requiredSkills) : null,
    });
  } catch (error) {
    console.error('Update idea error:', error);
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

    const ideaId = params.id;

    // Verify the idea belongs to the user
    const idea = await db.select().from(startupIdeas)
      .where(and(eq(startupIdeas.id, ideaId), eq(startupIdeas.userId, session.user.id)))
      .limit(1);

    if (!idea[0]) {
      return NextResponse.json(
        { error: 'Idea not found' },
        { status: 404 }
      );
    }

    await db.delete(startupIdeas).where(eq(startupIdeas.id, ideaId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete idea error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

