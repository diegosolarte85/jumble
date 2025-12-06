# ML Matching Service

Production-ready ML-powered matching algorithm for the co-founder matching platform.

## Features

- **Idea Embedding**: Uses TF-IDF to create semantic embeddings of startup ideas
- **Skill Analysis**: Analyzes user skills for complementarity
- **Match Scoring**: Calculates match scores based on:
  - Idea alignment (0.6-0.9 similarity range - aligned but not identical)
  - Skill complementarity (how well users fill each other's skill gaps)
  - Skill overlap (lower is better for diversity)
  - Role compatibility (technical + business, design + engineering, etc.)
- **Ranking**: Ranks matches to surface best candidates first
- **Production Ready**: CORS enabled, error handling, API documentation

## Installation

```bash
pip install -r requirements.txt
```

## Quick Start

### 1. Test the Algorithm

```bash
cd ml_service
python test_simple_matching.py
```

### 2. Run Example

```bash
cd ml_service
python example_usage.py
```

### 3. Start API Server

```bash
cd ml_service
python run_ml_service.py
```

Or with uvicorn:
```bash
cd ml_service
uvicorn api:app --reload
```

The API will be available at `http://localhost:8000`
- API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Usage

### Python API

```python
from simple_matching import SimpleMatchingAlgorithm

# Initialize (no downloads needed!)
matcher = SimpleMatchingAlgorithm()

# Define users
user1 = {
    'idea': 'Building an AI fitness app...',
    'skills': ['Python', 'ML', 'Backend'],
    'required_skills': ['Mobile Dev', 'Design']
}

user2 = {
    'idea': 'Creating a mobile fitness app...',
    'skills': ['React Native', 'UI/UX'],
    'required_skills': ['Backend', 'ML']
}

# Calculate match score
score, explanation = matcher.calculate_match_score(user1, user2)
print(f"Match Score: {score}")
print(f"Explanation: {explanation}")

# Rank multiple candidates
candidates = [user2, user3, user4]
matches = matcher.rank_matches(user1, candidates, top_k=10)
```

### REST API

See [INTEGRATION.md](INTEGRATION.md) for detailed frontend/backend integration guide.

**Get Matches:**
```bash
POST /api/v1/matches
```

**Calculate Similarity:**
```bash
POST /api/v1/similarity
```

## Algorithm Details

### Match Score Calculation

The final match score is a weighted combination of:

1. **Idea Alignment (35%)**: TF-IDF cosine similarity between idea descriptions
   - Ideal range: 0.6-0.9 (aligned but not identical)
   - Too similar (>0.95) or too different (<0.5) are penalized

2. **Skill Complementarity (30%)**: How well users fill each other's skill gaps
   - Calculated bidirectionally and averaged

3. **Skill Overlap (20%)**: Inverse of skill overlap (lower overlap = higher score)
   - Encourages complementary, non-overlapping skills

4. **Role Compatibility (15%)**: Compatibility between role categories
   - Complementary roles (e.g., technical + business) score higher
   - Same roles score lower (want diversity)

### Model

Uses **TF-IDF (Term Frequency-Inverse Document Frequency)**:
- Fast and efficient
- Completely local, no external downloads
- Works offline
- Perfect for corporate environments
- Good performance for semantic similarity tasks

## Project Structure

```
ml_service/
├── simple_matching.py      # Core matching algorithm
├── api.py                  # FastAPI service endpoints
├── utils.py                # Utility functions
├── example_usage.py        # Example usage script
├── test_simple_matching.py # Test script
├── run_ml_service.py       # Script to run API server
├── INTEGRATION.md          # Frontend/backend integration guide
└── README.md               # This file
```

## Configuration

### Environment Variables

- `CORS_ORIGINS`: Comma-separated list of allowed origins (default: "*")
- `PORT`: Server port (default: 8000)
- `HOST`: Server host (default: 0.0.0.0)

Example:
```bash
export CORS_ORIGINS="http://localhost:3000,https://yourdomain.com"
export PORT=8000
```

## Integration

For detailed integration instructions with frontend (React/Next.js) and backend (Node.js/Express), see [INTEGRATION.md](INTEGRATION.md).

## Testing

Run the test suite:
```bash
cd ml_service
python test_simple_matching.py
```

## Production Deployment

1. Set `CORS_ORIGINS` to your production frontend domain
2. Use environment variables for configuration
3. Add authentication/authorization if needed
4. Set up monitoring and logging
5. Consider using a reverse proxy (nginx) for SSL termination

## License

See main project LICENSE file.
