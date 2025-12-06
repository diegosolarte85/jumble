"""
FastAPI service for ML matching endpoints
Production-ready API for frontend/backend integration
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from simple_matching import SimpleMatchingAlgorithm
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Co-founder Matching ML Service",
    version="1.0.0",
    description="ML-powered matching algorithm for co-founder discovery",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware for frontend integration
# Configure allowed origins via environment variable or default to all
import os
allowed_origins = os.getenv(
    "CORS_ORIGINS", 
    "*"  # In production, set CORS_ORIGINS="https://yourdomain.com,https://app.yourdomain.com"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Initialize matching algorithm (singleton)
# Using SimpleMatchingAlgorithm - local, fast, no external dependencies
matcher = SimpleMatchingAlgorithm()
logger.info("ML Matching Service initialized with SimpleMatchingAlgorithm (TF-IDF)")


# Pydantic models for API requests/responses
class UserProfile(BaseModel):
    """User profile model for matching"""
    user_id: str = Field(..., description="Unique user identifier")
    idea: str = Field(..., description="Startup idea description", min_length=10)
    skills: List[str] = Field(..., description="List of user's skills", min_items=1)
    required_skills: Optional[List[str]] = Field(
        default=None, 
        description="Skills required for the startup"
    )
    bio: Optional[str] = Field(default=None, description="User bio")
    location: Optional[str] = Field(default=None, description="User location")
    commitment_level: Optional[str] = Field(
        default=None, 
        description="Commitment level: fulltime, parttime, weekends"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_123",
                "idea": "Building an AI-powered fitness app that provides personalized workout plans",
                "skills": ["Python", "Machine Learning", "Backend Development"],
                "required_skills": ["Mobile Development", "UI/UX Design", "Marketing"],
                "bio": "Experienced ML engineer looking for a co-founder",
                "location": "San Francisco, CA",
                "commitment_level": "fulltime"
            }
        }


class MatchRequest(BaseModel):
    """Request model for getting matches"""
    target_user: UserProfile = Field(..., description="The user to find matches for")
    candidate_users: List[UserProfile] = Field(
        ..., 
        description="List of candidate users to match against",
        min_items=1
    )
    top_k: Optional[int] = Field(
        default=10, 
        ge=1, 
        le=100,
        description="Number of top matches to return"
    )


class MatchExplanation(BaseModel):
    """Detailed explanation of match score"""
    final_score: float = Field(..., description="Overall match score (0-1)")
    idea_similarity: float = Field(..., description="Idea similarity score (0-1)")
    idea_score: float = Field(..., description="Normalized idea alignment score")
    skill_complementarity: float = Field(..., description="How well skills complement (0-1)")
    skill_overlap: float = Field(..., description="Skill overlap (lower is better, 0-1)")
    skill_overlap_score: float = Field(..., description="Inverted skill overlap score")
    role_compatibility: float = Field(..., description="Role compatibility score (0-1)")
    user1_role: Optional[str] = Field(default=None, description="Detected role of user 1")
    user2_role: Optional[str] = Field(default=None, description="Detected role of user 2")
    connection_strength: float = Field(
        ..., 
        description="Strength of connection (0-100, higher is stronger)",
        ge=0,
        le=100
    )
    success_probability: float = Field(
        ..., 
        description="Probability of successful partnership (0-1, higher is more likely)",
        ge=0,
        le=1
    )
    match_characteristics: List[str] = Field(
        ...,
        description="Key characteristics that make this a good match (e.g., 'Strong idea alignment', 'Complementary roles')"
    )


class MatchResult(BaseModel):
    """Single match result"""
    user_id: str = Field(..., description="Matched user ID")
    match_score: float = Field(..., description="Match score (0-1, higher is better)")
    connection_strength: float = Field(
        ..., 
        description="Strength of connection (0-100, higher is stronger)",
        ge=0,
        le=100
    )
    success_probability: float = Field(
        ..., 
        description="Probability of successful partnership (0-1, higher is more likely)",
        ge=0,
        le=1
    )
    match_characteristics: List[str] = Field(
        ...,
        description="Key characteristics that make this a good match"
    )
    explanation: MatchExplanation = Field(..., description="Detailed match explanation")
    user_profile: UserProfile = Field(..., description="Full user profile")


class MatchResponse(BaseModel):
    """Response model for match requests"""
    matches: List[MatchResult] = Field(..., description="Ranked list of matches")
    total_candidates: int = Field(..., description="Total number of candidates evaluated")
    target_user_id: str = Field(..., description="ID of the user matches were found for")


class SimilarityRequest(BaseModel):
    """Request model for idea similarity calculation"""
    idea1: str = Field(..., description="First startup idea", min_length=10)
    idea2: str = Field(..., description="Second startup idea", min_length=10)


class SimilarityResponse(BaseModel):
    """Response model for similarity calculation"""
    similarity: float = Field(..., description="Similarity score (0-1)", ge=0, le=1)
    interpretation: str = Field(..., description="Human-readable interpretation")


@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "status": "healthy",
        "service": "co-founder-matching-ml",
        "version": "1.0.0",
        "algorithm": "SimpleMatchingAlgorithm (TF-IDF)",
        "endpoints": {
            "health": "/health",
            "matches": "/api/v1/matches",
            "similarity": "/api/v1/similarity",
            "docs": "/docs"
        }
    }


@app.get("/health")
async def health():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "service": "co-founder-matching-ml"
    }


@app.post("/api/v1/similarity", response_model=SimilarityResponse)
async def calculate_similarity(request: SimilarityRequest):
    """
    Calculate similarity between two startup ideas.
    
    Returns a similarity score between 0 and 1, where:
    - 0.0-0.3: Very different ideas
    - 0.3-0.6: Somewhat related ideas
    - 0.6-0.9: Similar/related ideas (ideal for co-founder matching)
    - 0.9-1.0: Very similar ideas (may be too similar)
    """
    try:
        similarity = matcher.calculate_idea_similarity(request.idea1, request.idea2)
        
        # Add human-readable interpretation
        if similarity < 0.3:
            interpretation = "Very different ideas"
        elif similarity < 0.6:
            interpretation = "Somewhat related ideas"
        elif similarity < 0.9:
            interpretation = "Similar ideas - good potential match"
        else:
            interpretation = "Very similar ideas - may be too aligned"
        
        return SimilarityResponse(
            similarity=similarity,
            interpretation=interpretation
        )
    except Exception as e:
        logger.error(f"Error calculating similarity: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error calculating similarity: {str(e)}")


@app.post("/api/v1/matches", response_model=MatchResponse)
async def get_matches(request: MatchRequest):
    """
    Get ranked matches for a target user.
    
    Returns top_k best matches with:
    - **connection_strength**: Strength of connection (0-100 scale)
      - 0-30: Weak connection
      - 30-60: Moderate connection
      - 60-80: Strong connection
      - 80-100: Very strong connection
    
    - **success_probability**: Probability of successful partnership (0-1)
      - 0.0-0.3: Low probability
      - 0.3-0.6: Moderate probability
      - 0.6-0.8: High probability
      - 0.8-1.0: Very high probability
    
    Match scoring based on:
    - Idea alignment (0.6-0.9 similarity range)
    - Skill complementarity
    - Skill overlap (lower is better)
    - Role compatibility
    """
    try:
        # Convert Pydantic models to dicts for matching algorithm
        target_dict = {
            'idea': request.target_user.idea,
            'skills': request.target_user.skills,
            'required_skills': request.target_user.required_skills or []
        }
        
        candidate_dicts = [
            {
                'user_id': user.user_id,
                'idea': user.idea,
                'skills': user.skills,
                'required_skills': user.required_skills or []
            }
            for user in request.candidate_users
        ]
        
        # Get ranked matches
        ranked_matches = matcher.rank_matches(
            target_dict,
            candidate_dicts,
            top_k=request.top_k
        )
        
        # Format response
        match_results = []
        for candidate_dict, score, explanation in ranked_matches:
            # Find original user profile
            original_user = next(
                u for u in request.candidate_users 
                if u.user_id == candidate_dict['user_id']
            )
            
            match_results.append(MatchResult(
                user_id=candidate_dict['user_id'],
                match_score=score,
                connection_strength=explanation.get('connection_strength', score * 100),
                success_probability=explanation.get('success_probability', score),
                match_characteristics=explanation.get('match_characteristics', []),
                explanation=MatchExplanation(**explanation),
                user_profile=original_user
            ))
        
        return MatchResponse(
            matches=match_results,
            total_candidates=len(request.candidate_users),
            target_user_id=request.target_user.user_id
        )
    
    except Exception as e:
        logger.error(f"Error getting matches: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/embed")
async def embed_text(text: str):
    """
    Generate embedding for a text string.
    Useful for debugging and testing.
    """
    try:
        embedding = matcher.embed_text(text)
        return {
            "text": text,
            "embedding_dim": len(embedding),
            "embedding": embedding.tolist()
        }
    except Exception as e:
        logger.error(f"Error generating embedding: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

