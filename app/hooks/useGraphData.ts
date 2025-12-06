'use client';

import { useState, useEffect, useCallback } from 'react';
import { mlClient, MatchResult, UserProfile } from '@/lib/ml-client';

export interface Skill {
  skillName: string;
  proficiencyLevel: 'beginner' | 'intermediate' | 'expert';
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  industry: string | null;
  stage: 'idea' | 'mvp' | 'launched';
}

export interface UserRecommendation {
  id: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  profilePicture?: string | null;
  commitmentLevel: 'fulltime' | 'parttime' | 'weekends' | null;
  skills: Skill[];
  ideas: Idea[];
}

export interface GraphNode {
  id: string;
  name: string;
  bio: string | null;
  isCurrentUser: boolean;
  skills: Skill[];
  ideas: Idea[];
  commitmentLevel: string | null;
  profilePicture?: string | null;
  // Visual properties
  nodeSize: number;
  color: string;
  // ML match properties (only for non-current user nodes)
  matchScore?: number;
  connectionStrength?: number;
  successProbability?: number;
  matchCharacteristics?: string[];
  explanation?: {
    ideaSimilarity: number;
    skillComplementarity: number;
    roleCompatibility: number;
    userRole: string | null;
  };
  // Position properties (added by react-force-graph)
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  strength: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface CurrentUser {
  id: string;
  name: string | null;
  bio: string | null;
  profilePicture?: string | null;
  commitmentLevel: string | null;
  skills: Skill[];
  ideas: Idea[];
}

// Color palette based on match score
function getNodeColorByScore(matchScore: number): string {
  if (matchScore >= 0.7) return '#ff00ff';  // Magenta - excellent match
  if (matchScore >= 0.5) return '#8b5cf6';  // Purple - good match
  if (matchScore >= 0.3) return '#3b82f6';  // Blue - moderate match
  return '#64748b';                          // Gray - low match
}

const CURRENT_USER_COLOR = '#00ffff'; // Cyan

// Convert API user to ML service UserProfile format
function toMLUserProfile(user: UserRecommendation | CurrentUser, userId: string): UserProfile {
  // Combine all ideas into one description
  const ideaText = 'ideas' in user && user.ideas.length > 0
    ? user.ideas.map(i => `${i.title}: ${i.description}`).join('. ')
    : 'Looking for startup opportunities';

  // Get skill names
  const skillNames = user.skills.map(s => s.skillName);

  return {
    user_id: userId,
    idea: ideaText,
    skills: skillNames.length > 0 ? skillNames : ['General'],
    bio: user.bio || undefined,
    location: 'location' in user ? user.location || undefined : undefined,
    commitment_level: user.commitmentLevel || undefined,
  };
}

export function useGraphData() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mlServiceAvailable, setMlServiceAvailable] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch current user and recommendations in parallel
      const [meResponse, recommendationsResponse] = await Promise.all([
        fetch('/api/users/me'),
        fetch('/api/matches/recommendations'),
      ]);

      if (!meResponse.ok) {
        if (meResponse.status === 401) {
          setError('Please sign in to view matches');
          setLoading(false);
          return;
        }
        const errorText = await meResponse.text().catch(() => 'Unknown error');
        console.error('Failed to fetch user profile:', meResponse.status, errorText);
        throw new Error(`Failed to fetch user profile: ${meResponse.status} ${errorText}`);
      }

      if (!recommendationsResponse.ok) {
        const errorText = await recommendationsResponse.text().catch(() => 'Unknown error');
        console.error('Failed to fetch recommendations:', recommendationsResponse.status, errorText);
        throw new Error(`Failed to fetch recommendations: ${recommendationsResponse.status} ${errorText}`);
      }

      const me: CurrentUser = await meResponse.json();
      const recommendations: UserRecommendation[] = await recommendationsResponse.json();

      setCurrentUser(me);

      // Check if ML service is available
      const mlAvailable = await mlClient.healthCheck();
      setMlServiceAvailable(mlAvailable);

      let matchResults: MatchResult[] = [];

      if (mlAvailable && recommendations.length > 0) {
        try {
          // Prepare data for ML service
          const targetUser = toMLUserProfile(me, me.id);
          const candidateUsers = recommendations.map(r => toMLUserProfile(r, r.id));

          // Get ML match scores
          const mlResponse = await mlClient.getMatches(targetUser, candidateUsers, 50);
          matchResults = mlResponse.matches;
        } catch (mlError) {
          console.warn('ML service error, using fallback scoring:', mlError);
        }
      }

      // Create a map of match results by user ID for quick lookup
      const matchMap = new Map<string, MatchResult>();
      matchResults.forEach(m => matchMap.set(m.user_id, m));

      // Transform to graph data
      const nodes: GraphNode[] = [
        // Current user node (centered, larger)
        {
          id: me.id,
          name: me.name || 'You',
          bio: me.bio,
          isCurrentUser: true,
          skills: me.skills || [],
          ideas: me.ideas || [],
          commitmentLevel: me.commitmentLevel,
          profilePicture: me.profilePicture,
          nodeSize: 18,
          color: CURRENT_USER_COLOR,
        },
        // Recommendation nodes with ML scores
        ...recommendations.map((user) => {
          const mlMatch = matchMap.get(user.id);
          const matchScore = mlMatch?.match_score ?? 0.3; // Default score if no ML

          return {
            id: user.id,
            name: user.name || 'Anonymous',
            bio: user.bio,
            isCurrentUser: false,
            skills: user.skills,
            ideas: user.ideas,
            commitmentLevel: user.commitmentLevel,
            profilePicture: user.profilePicture,
            // Size based on match score (8-14px range)
            nodeSize: 8 + matchScore * 6,
            color: getNodeColorByScore(matchScore),
            // ML properties
            matchScore: mlMatch?.match_score,
            connectionStrength: mlMatch?.connection_strength,
            successProbability: mlMatch?.success_probability,
            matchCharacteristics: mlMatch?.match_characteristics,
            explanation: mlMatch ? {
              ideaSimilarity: mlMatch.explanation.idea_similarity,
              skillComplementarity: mlMatch.explanation.skill_complementarity,
              roleCompatibility: mlMatch.explanation.role_compatibility,
              userRole: mlMatch.explanation.user2_role,
            } : undefined,
          };
        }),
      ];

      // Create links from current user to all recommendations
      // Link strength based on match score
      const links: GraphLink[] = recommendations.map((user) => {
        const mlMatch = matchMap.get(user.id);
        const strength = mlMatch?.match_score ?? 0.3;
        return {
          source: me.id,
          target: user.id,
          strength,
        };
      });

      // Sort nodes by match score (highest first, after current user)
      nodes.sort((a, b) => {
        if (a.isCurrentUser) return -1;
        if (b.isCurrentUser) return 1;
        return (b.matchScore ?? 0) - (a.matchScore ?? 0);
      });

      setGraphData({ nodes, links });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSwipe = useCallback(async (userId: string, direction: 'left' | 'right') => {
    try {
      const response = await fetch('/api/swipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ swipedId: userId, direction }),
      });

      if (!response.ok) {
        throw new Error('Failed to record swipe');
      }

      const result = await response.json();

      // Remove the swiped user from the graph
      setGraphData((prev) => ({
        nodes: prev.nodes.filter((node) => node.id !== userId),
        links: prev.links.filter((link) => 
          link.source !== userId && link.target !== userId
        ),
      }));

      // Clear selection if we swiped on the selected node
      if (selectedNode?.id === userId) {
        setSelectedNode(null);
      }

      return result;
    } catch (err) {
      console.error('Swipe error:', err);
      throw err;
    }
  }, [selectedNode]);

  return {
    graphData,
    currentUser,
    selectedNode,
    setSelectedNode,
    loading,
    error,
    refetch: fetchData,
    handleSwipe,
    mlServiceAvailable,
  };
}
