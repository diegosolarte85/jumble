# Frontend/Backend Integration Guide

This guide explains how to integrate the ML matching service with your frontend and backend.

## API Endpoints

### Base URL
```
http://localhost:8000  # Development
https://api.yourdomain.com  # Production
```

### Endpoints

#### 1. Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "co-founder-matching-ml"
}
```

#### 2. Get Matches
```http
POST /api/v1/matches
Content-Type: application/json
```

**Request Body:**
```json
{
  "target_user": {
    "user_id": "user_123",
    "idea": "Building an AI-powered fitness app that provides personalized workout plans",
    "skills": ["Python", "Machine Learning", "Backend Development"],
    "required_skills": ["Mobile Development", "UI/UX Design", "Marketing"],
    "bio": "Experienced ML engineer",
    "location": "San Francisco, CA",
    "commitment_level": "fulltime"
  },
  "candidate_users": [
    {
      "user_id": "user_456",
      "idea": "Creating a mobile fitness application with AI recommendations",
      "skills": ["React Native", "UI/UX Design", "Figma"],
      "required_skills": ["Backend Development", "Machine Learning"]
    }
  ],
  "top_k": 10
}
```

**Response:**
```json
{
  "matches": [
    {
      "user_id": "user_456",
      "match_score": 0.753,
      "connection_strength": 75.3,
      "success_probability": 0.866,
      "match_characteristics": [
        "Strong idea alignment",
        "Ideas are aligned but not identical (ideal range)",
        "Strong skill complementarity",
        "Low skill overlap (diverse expertise)",
        "Complementary roles (technical + design)",
        "Strong match across all dimensions",
        "Skills effectively fill each other's gaps"
      ],
      "explanation": {
        "final_score": 0.753,
        "idea_similarity": 0.654,
        "idea_score": 1.0,
        "skill_complementarity": 0.712,
        "skill_overlap": 0.083,
        "skill_overlap_score": 0.917,
        "role_compatibility": 0.900,
        "user1_role": "technical",
        "user2_role": "design",
        "connection_strength": 75.3,
        "success_probability": 0.866,
        "match_characteristics": [
          "Strong idea alignment",
          "Ideas are aligned but not identical (ideal range)",
          "Strong skill complementarity",
          "Low skill overlap (diverse expertise)",
          "Complementary roles (technical + design)",
          "Strong match across all dimensions",
          "Skills effectively fill each other's gaps"
        ]
      },
      "user_profile": {
        "user_id": "user_456",
        "idea": "Creating a mobile fitness application...",
        "skills": ["React Native", "UI/UX Design", "Figma"],
        "required_skills": ["Backend Development", "Machine Learning"],
        "bio": null,
        "location": null,
        "commitment_level": null
      }
    }
  ],
  "total_candidates": 1,
  "target_user_id": "user_123"
}
```

#### 3. Calculate Idea Similarity
```http
POST /api/v1/similarity
Content-Type: application/json
```

**Request Body:**
```json
{
  "idea1": "Building an AI-powered fitness app",
  "idea2": "Creating a mobile fitness application with AI"
}
```

**Response:**
```json
{
  "similarity": 0.654,
  "interpretation": "Similar ideas - good potential match"
}
```

## Frontend Integration (React/Next.js Example)

### 1. Install Dependencies
```bash
npm install axios
# or
npm install fetch
```

### 2. Create API Client
```typescript
// lib/ml-api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8000';

export interface UserProfile {
  user_id: string;
  idea: string;
  skills: string[];
  required_skills?: string[];
  bio?: string;
  location?: string;
  commitment_level?: string;
}

export interface MatchResult {
  user_id: string;
  match_score: number;
  connection_strength: number;  // 0-100
  success_probability: number;  // 0-1
  match_characteristics: string[];  // Key strengths of the match
  explanation: {
    final_score: number;
    idea_similarity: number;
    skill_complementarity: number;
    role_compatibility: number;
    user1_role?: string;
    user2_role?: string;
    connection_strength: number;
    success_probability: number;
    match_characteristics: string[];
  };
  user_profile: UserProfile;
}

export interface MatchResponse {
  matches: MatchResult[];
  total_candidates: number;
  target_user_id: string;
}

export async function getMatches(
  targetUser: UserProfile,
  candidates: UserProfile[],
  topK: number = 10
): Promise<MatchResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/matches`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      target_user: targetUser,
      candidate_users: candidates,
      top_k: topK,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

export async function calculateSimilarity(
  idea1: string,
  idea2: string
): Promise<{ similarity: number; interpretation: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/similarity`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idea1, idea2 }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}
```

### 3. Use in Components
```typescript
// components/MatchCard.tsx
import { getMatches, MatchResult } from '@/lib/ml-api';
import { useState, useEffect } from 'react';

export function MatchCard({ userId, userProfile }) {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMatches() {
      try {
        // Fetch candidates from your backend
        const candidates = await fetchCandidates(userId);
        
        // Get matches from ML service
        const response = await getMatches(userProfile, candidates);
        setMatches(response.matches);
      } catch (error) {
        console.error('Error fetching matches:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
  }, [userId]);

  if (loading) return <div>Loading matches...</div>;

  return (
    <div>
      {matches.map((match) => (
        <div key={match.user_id} className="match-card">
          <h3>Match Score: {(match.match_score * 100).toFixed(1)}%</h3>
          <div className="match-metrics">
            <div>Connection Strength: {match.connection_strength.toFixed(1)}/100</div>
            <div>Success Probability: {(match.success_probability * 100).toFixed(1)}%</div>
          </div>
          <p>{match.user_profile.idea}</p>
          <div className="match-characteristics">
            <h4>Why this is a good match:</h4>
            <ul>
              {match.match_characteristics.map((char, idx) => (
                <li key={idx}>{char}</li>
              ))}
            </ul>
          </div>
          <div>
            <span>Idea Similarity: {(match.explanation.idea_similarity * 100).toFixed(1)}%</span>
            <span>Skill Fit: {(match.explanation.skill_complementarity * 100).toFixed(1)}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

## Backend Integration (Node.js/Express Example)

### 1. Create Service Wrapper
```javascript
// services/mlMatchingService.js
const axios = require('axios');

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

class MLMatchingService {
  async getMatches(targetUser, candidates, topK = 10) {
    try {
      const response = await axios.post(`${ML_API_URL}/api/v1/matches`, {
        target_user: targetUser,
        candidate_users: candidates,
        top_k: topK,
      });
      return response.data;
    } catch (error) {
      console.error('ML matching error:', error);
      throw new Error('Failed to get matches');
    }
  }

  async calculateSimilarity(idea1, idea2) {
    try {
      const response = await axios.post(`${ML_API_URL}/api/v1/similarity`, {
        idea1,
        idea2,
      });
      return response.data;
    } catch (error) {
      console.error('Similarity calculation error:', error);
      throw new Error('Failed to calculate similarity');
    }
  }
}

module.exports = new MLMatchingService();
```

### 2. Use in API Routes
```javascript
// routes/matches.js
const express = require('express');
const router = express.Router();
const mlMatchingService = require('../services/mlMatchingService');
const User = require('../models/User');

router.post('/:userId/matches', async (req, res) => {
  try {
    const { userId } = req.params;
    const { topK = 10 } = req.query;

    // Get target user from database
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get candidate users (exclude already swiped, etc.)
    const candidates = await User.find({
      _id: { $ne: userId },
      // Add your filtering logic here
    }).limit(100);

    // Format for ML service
    const targetUserProfile = {
      user_id: targetUser._id.toString(),
      idea: targetUser.startupIdea,
      skills: targetUser.skills,
      required_skills: targetUser.requiredSkills,
    };

    const candidateProfiles = candidates.map(user => ({
      user_id: user._id.toString(),
      idea: user.startupIdea,
      skills: user.skills,
      required_skills: user.requiredSkills,
    }));

    // Get matches from ML service
    const matches = await mlMatchingService.getMatches(
      targetUserProfile,
      candidateProfiles,
      parseInt(topK)
    );

    res.json(matches);
  } catch (error) {
    console.error('Error getting matches:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

## Environment Variables

### ML Service (.env)
```bash
# CORS Configuration
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# Server Configuration
PORT=8000
HOST=0.0.0.0
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_ML_API_URL=http://localhost:8000
```

### Backend (.env)
```bash
ML_API_URL=http://localhost:8000
```

## Error Handling

The API returns standard HTTP status codes:
- `200`: Success
- `400`: Bad Request (validation errors)
- `500`: Internal Server Error

Example error response:
```json
{
  "detail": "Error message here"
}
```

## Performance Considerations

1. **Batch Processing**: The API can handle multiple candidates in one request
2. **Caching**: Consider caching match results for frequently accessed users
3. **Rate Limiting**: Implement rate limiting in production
4. **Async Processing**: For large candidate sets, consider async processing

## Testing

Test the API using curl:
```bash
curl -X POST http://localhost:8000/api/v1/matches \
  -H "Content-Type: application/json" \
  -d '{
    "target_user": {
      "user_id": "test_1",
      "idea": "Building a fitness app",
      "skills": ["Python", "ML"]
    },
    "candidate_users": [{
      "user_id": "test_2",
      "idea": "Creating a mobile fitness app",
      "skills": ["React Native", "Design"]
    }]
  }'
```

## Production Deployment

1. Set `CORS_ORIGINS` to your production frontend domain
2. Use environment variables for configuration
3. Add authentication/authorization if needed
4. Set up monitoring and logging
5. Consider using a reverse proxy (nginx) for SSL termination

