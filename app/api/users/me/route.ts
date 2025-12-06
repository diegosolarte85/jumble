import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, skills, startupIdeas } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);

    if (!user[0]) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user skills
    const userSkills = await db.select().from(skills).where(eq(skills.userId, session.user.id));

    // Get user startup ideas
    const userIdeas = await db.select().from(startupIdeas).where(eq(startupIdeas.userId, session.user.id));

    const userData = user[0];
    return NextResponse.json({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      bio: userData.bio,
      location: userData.location,
      profilePicture: userData.profilePicture || null,
      commitmentLevel: userData.commitmentLevel,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
      skills: userSkills,
      ideas: userIdeas,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, bio, location, profilePicture, commitmentLevel } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
    if (commitmentLevel !== undefined) updateData.commitmentLevel = commitmentLevel;

    await db.update(users)
      .set(updateData)
      .where(eq(users.id, session.user.id));

    const updatedUser = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);

    return NextResponse.json(updatedUser[0]);
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

