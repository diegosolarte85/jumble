const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export interface IdeaEmbeddingResponse {
  embedding: number[];
}

export interface SkillsEmbeddingResponse {
  embedding: number[];
}

export interface MatchScore {
  user_id: string;
  match_score: number;
  idea_similarity: number;
  skill_complementarity: number;
}

export interface MatchRecommendationsResponse {
  recommendations: MatchScore[];
}

export class MLClient {
  private baseUrl: string;

  constructor(baseUrl: string = ML_SERVICE_URL) {
    this.baseUrl = baseUrl;
  }

  async embedIdea(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/embed/idea`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`ML service error: ${response.statusText}`);
    }

    const data: IdeaEmbeddingResponse = await response.json();
    return data.embedding;
  }

  async embedSkills(skills: string[]): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/embed/skills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ skills }),
    });

    if (!response.ok) {
      throw new Error(`ML service error: ${response.statusText}`);
    }

    const data: IdeaEmbeddingResponse[] = await response.json();
    return data[0]?.embedding || [];
  }

  async getMatchRecommendations(
    userId: string,
    ideaEmbedding: number[],
    skillsEmbeddings: number[][],
    otherUsers: Array<{
      id: string;
      idea_embedding: number[] | null;
      skills_embeddings: number[][] | null;
    }>
  ): Promise<MatchScore[]> {
    const response = await fetch(`${this.baseUrl}/match/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        idea_embedding: ideaEmbedding,
        skills_embeddings: skillsEmbeddings,
        other_users: otherUsers,
      }),
    });

    if (!response.ok) {
      throw new Error(`ML service error: ${response.statusText}`);
    }

    const data: MatchRecommendationsResponse = await response.json();
    return data.recommendations;
  }
}

export const mlClient = new MLClient();

