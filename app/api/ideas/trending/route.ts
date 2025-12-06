import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { startupIdeas, users } from '@/drizzle/schema';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get trending ideas (most recent)
    // Public endpoint - no auth required for viewing
    const ideas = await db
      .select()
      .from(startupIdeas)
      .orderBy(desc(startupIdeas.createdAt))
      .limit(100);

    // Get user info for each idea
    const ideasWithUsers = await Promise.all(
      ideas.map(async (idea) => {
        const user = await db
          .select({
            name: users.name,
            profilePicture: users.profilePicture,
          })
          .from(users)
          .where(eq(users.id, idea.userId))
          .limit(1);

        return {
          id: idea.id,
          title: idea.title,
          description: idea.description,
          industry: idea.industry,
          stage: idea.stage,
          createdAt: idea.createdAt,
          userId: idea.userId,
          userName: user[0]?.name || null,
          userProfilePicture: user[0]?.profilePicture || null,
        };
      })
    );

    // Calculate "trending" score based on recency and stage
    const trendingIdeas = ideasWithUsers.map((idea) => {
      const daysSinceCreation = idea.createdAt
        ? Math.floor((Date.now() - idea.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      
      // Trending score: higher for recent ideas and launched/MVP stages
      let trendingScore = 100 - daysSinceCreation; // Recency boost
      if (idea.stage === 'launched') trendingScore += 30;
      else if (idea.stage === 'mvp') trendingScore += 15;
      
      return {
        ...idea,
        trendingScore: Math.max(0, trendingScore),
        requiredSkills: null, // Not needed for trending view
      };
    });

    // Sort by trending score
    trendingIdeas.sort((a, b) => b.trendingScore - a.trendingScore);

    return NextResponse.json(trendingIdeas.slice(0, 50)); // Top 50 trending
  } catch (error) {
    console.error('Get trending ideas error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

