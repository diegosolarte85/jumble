from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List, Optional
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI(title="Jumble ML Service")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model
model = SentenceTransformer('all-MiniLM-L6-v2')

class IdeaEmbeddingRequest(BaseModel):
    text: str

class SkillsEmbeddingRequest(BaseModel):
    skills: List[str]

class MatchRecommendationRequest(BaseModel):
    user_id: str
    idea_embedding: List[float]
    skills_embeddings: List[List[float]]
    other_users: List[dict]

class EmbeddingResponse(BaseModel):
    embedding: List[float]

class MatchScoreResponse(BaseModel):
    user_id: str
    match_score: float
    idea_similarity: float
    skill_complementarity: float

class MatchRecommendationsResponse(BaseModel):
    recommendations: List[MatchScoreResponse]

@app.get("/health")
async def health_check():
    return {"status": "ok", "model": "all-MiniLM-L6-v2"}

@app.post("/embed/idea", response_model=EmbeddingResponse)
async def embed_idea(request: IdeaEmbeddingRequest):
    """Generate embedding for a startup idea description."""
    try:
        embedding = model.encode(request.text).tolist()
        return EmbeddingResponse(embedding=embedding)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating embedding: {str(e)}")

@app.post("/embed/skills", response_model=List[EmbeddingResponse])
async def embed_skills(request: SkillsEmbeddingRequest):
    """Generate embeddings for a list of skills."""
    try:
        # Combine all skills into a single string for embedding
        skills_text = ", ".join(request.skills)
        embedding = model.encode(skills_text).tolist()
        return [EmbeddingResponse(embedding=embedding)]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating embeddings: {str(e)}")

@app.post("/match/recommend", response_model=MatchRecommendationsResponse)
async def get_match_recommendations(request: MatchRecommendationRequest):
    """Get match recommendations based on idea similarity and skill complementarity."""
    try:
        user_idea_embedding = np.array(request.idea_embedding).reshape(1, -1)
        user_skills_embeddings = np.array(request.skills_embeddings)
        
        recommendations = []
        
        for other_user in request.other_users:
            if not other_user.get('idea_embedding') or not other_user.get('skills_embeddings'):
                continue
            
            other_idea_embedding = np.array(other_user['idea_embedding']).reshape(1, -1)
            other_skills_embeddings = np.array(other_user['skills_embeddings'])
            
            # Calculate idea similarity (cosine similarity)
            idea_similarity = cosine_similarity(user_idea_embedding, other_idea_embedding)[0][0]
            
            # Calculate skill complementarity
            # Lower overlap = higher complementarity
            if len(user_skills_embeddings) > 0 and len(other_skills_embeddings) > 0:
                # Calculate average similarity between skill sets
                skill_similarities = []
                for user_skill in user_skills_embeddings:
                    for other_skill in other_skills_embeddings:
                        sim = cosine_similarity(
                            user_skill.reshape(1, -1),
                            other_skill.reshape(1, -1)
                        )[0][0]
                        skill_similarities.append(sim)
                
                avg_skill_similarity = np.mean(skill_similarities) if skill_similarities else 0
                # Complementarity is inverse of similarity (lower similarity = higher complementarity)
                skill_complementarity = 1 - avg_skill_similarity
            else:
                skill_complementarity = 0.5  # Default if no skills
            
            # Combined match score
            # Idea similarity should be in 0.6-0.9 range (aligned but not identical)
            # Weight: 60% idea similarity, 40% skill complementarity
            if 0.6 <= idea_similarity <= 0.9:
                match_score = (0.6 * idea_similarity) + (0.4 * skill_complementarity)
            else:
                # Penalize if idea similarity is outside optimal range
                match_score = (0.4 * idea_similarity) + (0.4 * skill_complementarity)
            
            recommendations.append(MatchScoreResponse(
                user_id=other_user['id'],
                match_score=float(match_score),
                idea_similarity=float(idea_similarity),
                skill_complementarity=float(skill_complementarity)
            ))
        
        # Sort by match score descending
        recommendations.sort(key=lambda x: x.match_score, reverse=True)
        
        return MatchRecommendationsResponse(recommendations=recommendations)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating matches: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

