/**
 * ML Service Client
 * Interfaces with the Python ML matching service for intelligent co-founder matching
 */

const ML_SERVICE_URL = process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://localhost:8000';

// Request Types
export interface UserProfile {
  user_id: string;
  idea: string;
  skills: string[];
  required_skills?: string[];
  bio?: string;
  location?: string;
  commitment_level?: string;
}

export interface MatchRequest {
  target_user: UserProfile;
  candidate_users: UserProfile[];
  top_k?: number;
}

// Response Types
export interface MatchExplanation {
  final_score: number;
  idea_similarity: number;
  idea_score: number;
  skill_complementarity: number;
  skill_overlap: number;
  skill_overlap_score: number;
  role_compatibility: number;
  user1_role: string | null;
  user2_role: string | null;
  connection_strength: number;
  success_probability: number;
  match_characteristics: string[];
}

export interface MatchResult {
  user_id: string;
  match_score: number;
  connection_strength: number;
  success_probability: number;
  match_characteristics: string[];
  explanation: MatchExplanation;
  user_profile: UserProfile;
}

export interface MatchResponse {
  matches: MatchResult[];
  total_candidates: number;
  target_user_id: string;
}

export interface SimilarityResponse {
  similarity: number;
  interpretation: string;
}

export interface HealthResponse {
  status: string;
  service: string;
}

class MLClient {
  private baseUrl: string;

  constructor(baseUrl: string = ML_SERVICE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if the ML service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get ranked matches for a target user
   */
  async getMatches(
    targetUser: UserProfile,
    candidateUsers: UserProfile[],
    topK: number = 20
  ): Promise<MatchResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target_user: targetUser,
        candidate_users: candidateUsers,
        top_k: topK,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(`ML service error: ${error.detail || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Calculate similarity between two startup ideas
   */
  async calculateSimilarity(idea1: string, idea2: string): Promise<SimilarityResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/similarity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idea1, idea2 }),
    });

    if (!response.ok) {
      throw new Error(`ML service error: ${response.statusText}`);
    }

    return response.json();
  }
}

export const mlClient = new MLClient();
export default mlClient;
