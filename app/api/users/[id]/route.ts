import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, skills, startupIdeas } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user[0]) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user skills (public)
    const userSkills = await db.select().from(skills).where(eq(skills.userId, userId));

    // Get user startup ideas (public)
    const userIdeas = await db.select().from(startupIdeas).where(eq(startupIdeas.userId, userId));

    const userData = user[0];
    return NextResponse.json({
      id: userData.id,
      name: userData.name,
      bio: userData.bio,
      location: userData.location,
      profilePicture: userData.profilePicture || null,
      commitmentLevel: userData.commitmentLevel,
      skills: userSkills.map(skill => ({
        id: skill.id,
        skillName: skill.skillName,
        proficiencyLevel: skill.proficiencyLevel,
      })),
      ideas: userIdeas.map(idea => ({
        id: idea.id,
        title: idea.title,
        description: idea.description,
        industry: idea.industry,
        stage: idea.stage,
      })),
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

