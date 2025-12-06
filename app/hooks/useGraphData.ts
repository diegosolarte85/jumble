'use client';

import { useState, useEffect, useCallback } from 'react';

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
  // Visual properties
  nodeSize: number;
  color: string;
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
  commitmentLevel: string | null;
  skills: Skill[];
  ideas: Idea[];
}

// Color palette for nodes
const NODE_COLORS = {
  currentUser: '#00ffff', // Cyan for current user
  highSkills: '#ff00ff',  // Magenta for users with many skills
  mediumSkills: '#8b5cf6', // Purple
  lowSkills: '#3b82f6',   // Blue
};

function getNodeColor(skillCount: number, isCurrentUser: boolean): string {
  if (isCurrentUser) return NODE_COLORS.currentUser;
  if (skillCount >= 5) return NODE_COLORS.highSkills;
  if (skillCount >= 3) return NODE_COLORS.mediumSkills;
  return NODE_COLORS.lowSkills;
}

function calculateLinkStrength(user: UserRecommendation): number {
  // Simple strength calculation based on profile completeness
  let score = 0;
  if (user.bio) score += 20;
  if (user.skills.length > 0) score += Math.min(user.skills.length * 10, 40);
  if (user.ideas.length > 0) score += Math.min(user.ideas.length * 20, 40);
  return Math.min(score, 100) / 100;
}

export function useGraphData() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        throw new Error('Failed to fetch user profile');
      }

      if (!recommendationsResponse.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const me: CurrentUser = await meResponse.json();
      const recommendations: UserRecommendation[] = await recommendationsResponse.json();

      setCurrentUser(me);

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
          nodeSize: 16,
          color: NODE_COLORS.currentUser,
        },
        // Recommendation nodes
        ...recommendations.map((user) => ({
          id: user.id,
          name: user.name || 'Anonymous',
          bio: user.bio,
          isCurrentUser: false,
          skills: user.skills,
          ideas: user.ideas,
          commitmentLevel: user.commitmentLevel,
          nodeSize: 10,
          color: getNodeColor(user.skills.length, false),
        })),
      ];

      // Create links from current user to all recommendations
      const links: GraphLink[] = recommendations.map((user) => ({
        source: me.id,
        target: user.id,
        strength: calculateLinkStrength(user),
      }));

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
  };
}

