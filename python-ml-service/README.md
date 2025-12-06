# Jumble ML Service

Python FastAPI service for generating embeddings and calculating match scores.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the service:
```bash
python main.py
```

Or with uvicorn:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

The service will be available at `http://localhost:8000`

## API Endpoints

### Health Check
- `GET /health` - Check service status

### Embeddings
- `POST /embed/idea` - Generate embedding for a startup idea
  - Body: `{ "text": "idea description" }`
  - Returns: `{ "embedding": [0.1, 0.2, ...] }`

- `POST /embed/skills` - Generate embedding for skills
  - Body: `{ "skills": ["skill1", "skill2", ...] }`
  - Returns: `[{ "embedding": [0.1, 0.2, ...] }]`

### Matching
- `POST /match/recommend` - Get match recommendations
  - Body: See `main.py` for request schema
  - Returns: List of match scores with idea similarity and skill complementarity

## Model

Uses `all-MiniLM-L6-v2` from Sentence Transformers (384 dimensions).

