'use client';

import { useState, useEffect, useCallback } from 'react';
import { mlClient } from '@/lib/ml-client';

export interface IdeaNode {
  id: string;
  title: string;
  description: string;
  industry: string | null;
  stage: 'idea' | 'mvp' | 'launched';
  userId: string;
  userName: string | null;
  userProfilePicture: string | null;
  trendingScore: number;
  // Visual properties
  nodeSize: number;
  color: string;
  // Position properties (added by react-force-graph)
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface IdeaLink {
  source: string;
  target: string;
  strength: number;
  type: 'industry' | 'similarity' | 'stage';
}

export interface IdeasGraphData {
  nodes: IdeaNode[];
  links: IdeaLink[];
}

// Color by stage
function getIdeaColor(stage: string, trendingScore: number): string {
  if (stage === 'launched') return '#10b981'; // Green - launched
  if (stage === 'mvp') return '#f59e0b'; // Amber - MVP
  return '#3b82f6'; // Blue - idea
}

// Size based on trending score
function getIdeaSize(trendingScore: number): number {
  return 8 + (trendingScore / 100) * 8; // 8-16px range
}

// Calculate similarity between two ideas
function calculateIdeaSimilarity(idea1: string, idea2: string): number {
  const words1 = new Set(idea1.toLowerCase().split(/\s+/));
  const words2 = new Set(idea2.toLowerCase().split(/\s+/));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  return intersection.size / union.size;
}

export function useIdeasGraph() {
  const [graphData, setGraphData] = useState<IdeasGraphData>({ nodes: [], links: [] });
  const [selectedIdea, setSelectedIdea] = useState<IdeaNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ideas/trending');
      
      if (!response.ok) {
        throw new Error('Failed to fetch trending ideas');
      }

      const ideas = await response.json();

      if (ideas.length === 0) {
        setGraphData({ nodes: [], links: [] });
        setLoading(false);
        return;
      }

      // Transform to graph nodes
      const nodes: IdeaNode[] = ideas.map((idea: any) => ({
        id: idea.id,
        title: idea.title,
        description: idea.description,
        industry: idea.industry,
        stage: idea.stage,
        userId: idea.userId,
        userName: idea.userName,
        userProfilePicture: idea.userProfilePicture,
        trendingScore: idea.trendingScore,
        nodeSize: getIdeaSize(idea.trendingScore),
        color: getIdeaColor(idea.stage, idea.trendingScore),
      }));

      // Create links based on similarity
      const links: IdeaLink[] = [];
      
      // Group by industry first
      const industryGroups = new Map<string, IdeaNode[]>();
      nodes.forEach(node => {
        const industry = node.industry || 'Other';
        if (!industryGroups.has(industry)) {
          industryGroups.set(industry, []);
        }
        industryGroups.get(industry)!.push(node);
      });

      // Connect ideas in the same industry
      industryGroups.forEach((groupIdeas) => {
        for (let i = 0; i < groupIdeas.length; i++) {
          for (let j = i + 1; j < groupIdeas.length; j++) {
            const similarity = calculateIdeaSimilarity(
              groupIdeas[i].description,
              groupIdeas[j].description
            );
            if (similarity > 0.1) {
              links.push({
                source: groupIdeas[i].id,
                target: groupIdeas[j].id,
                strength: similarity,
                type: 'industry',
              });
            }
          }
        }
      });

      // Connect ideas with high similarity across industries (top 20% most similar)
      const similarityLinks: Array<{ source: IdeaNode; target: IdeaNode; similarity: number }> = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const similarity = calculateIdeaSimilarity(nodes[i].description, nodes[j].description);
          if (similarity > 0.2 && nodes[i].industry !== nodes[j].industry) {
            similarityLinks.push({ source: nodes[i], target: nodes[j], similarity });
          }
        }
      }
      
      // Add top similarity links
      similarityLinks
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, Math.min(30, similarityLinks.length))
        .forEach(({ source, target, similarity }) => {
          links.push({
            source: source.id,
            target: target.id,
            strength: similarity,
            type: 'similarity',
          });
        });

      // Connect ideas with same stage (lighter connections)
      const stageGroups = new Map<string, IdeaNode[]>();
      nodes.forEach(node => {
        if (!stageGroups.has(node.stage)) {
          stageGroups.set(node.stage, []);
        }
        stageGroups.get(node.stage)!.push(node);
      });

      stageGroups.forEach((groupIdeas) => {
        if (groupIdeas.length > 1) {
          for (let i = 0; i < groupIdeas.length; i++) {
            for (let j = i + 1; j < Math.min(i + 3, groupIdeas.length); j++) {
              links.push({
                source: groupIdeas[i].id,
                target: groupIdeas[j].id,
                strength: 0.3,
                type: 'stage',
              });
            }
          }
        }
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

  return {
    graphData,
    selectedIdea,
    setSelectedIdea,
    loading,
    error,
    refetch: fetchData,
  };
}

