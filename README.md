# jumble
Connecting business ideas and creators together

A Bumble-style matching platform that connects startup creators based on complementary skills and aligned business ideas using ML-powered recommendations.

## Project Structure

```
jumble/
├── ml_service/          # ML matching algorithm service (all code here)
│   ├── matching_algorithm.py  # Advanced matching (sentence-transformers)
│   ├── simple_matching.py     # Simple local matching (TF-IDF, recommended)
│   ├── api.py                 # FastAPI service endpoints
│   ├── example_usage.py       # Example usage script
│   ├── test_simple_matching.py # Test script for simple matching
│   ├── test_ml_service.py     # Test script for advanced matching
│   ├── run_ml_service.py      # Script to run API server
│   ├── TEST_RESULTS.md        # Test results documentation
│   └── README.md              # ML service documentation
├── RFC.md               # Project requirements and specifications
└── requirements.txt     # Python dependencies
```

## ML Matching Service

The ML matching service implements the core algorithm for matching co-founders based on:
- **Idea Alignment**: Semantic similarity between startup ideas (0.6-0.9 range)
- **Skill Complementarity**: How well users fill each other's skill gaps
- **Skill Overlap**: Encourages diverse, non-overlapping skills
- **Role Compatibility**: Matches complementary roles (technical + business, etc.)

### Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Test the simple matching algorithm:**
   ```bash
   cd ml_service
   python test_simple_matching.py
   ```

3. **Run example:**
   ```bash
   cd ml_service
   python example_usage.py
   ```

4. **Start API server:**
   ```bash
   cd ml_service
   python run_ml_service.py
   ```
   Or with uvicorn:
   ```bash
   cd ml_service
   uvicorn api:app --reload
   ```

See [ml_service/README.md](ml_service/README.md) for detailed documentation.

## Development Status

### Phase 1: Core MVP (In Progress)
- [x] ML matching algorithm implementation
- [ ] Next.js project setup
- [ ] Database schema
- [ ] User authentication
- [ ] Profile creation UI
- [ ] Swipeable card interface

### Phase 2: ML Matching (Completed)
- [x] Python ML service with sentence transformers
- [x] Idea embedding pipeline
- [x] Skill embedding and comparison
- [x] Matching algorithm with scoring system
- [x] API endpoints for match recommendations

See [RFC.md](RFC.md) for full project specifications.