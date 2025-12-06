# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Test the Service
```bash
cd ml_service
python test_simple_matching.py
```

### 3. Start the API Server
```bash
cd ml_service
python run_ml_service.py
```

The API will be running at `http://localhost:8000`

## 📚 Next Steps

- **View API Documentation**: http://localhost:8000/docs
- **Read Integration Guide**: See [INTEGRATION.md](INTEGRATION.md)
- **See Examples**: Run `python example_usage.py`

## 🔌 Quick Integration Example

### Frontend (JavaScript/TypeScript)
```javascript
const response = await fetch('http://localhost:8000/api/v1/matches', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    target_user: {
      user_id: 'user_1',
      idea: 'Building a fitness app',
      skills: ['Python', 'ML']
    },
    candidate_users: [{
      user_id: 'user_2',
      idea: 'Creating a mobile fitness app',
      skills: ['React Native', 'Design']
    }],
    top_k: 10
  })
});

const matches = await response.json();
console.log(matches);
```

### Backend (Python)
```python
import requests

response = requests.post('http://localhost:8000/api/v1/matches', json={
    'target_user': {
        'user_id': 'user_1',
        'idea': 'Building a fitness app',
        'skills': ['Python', 'ML']
    },
    'candidate_users': [{
        'user_id': 'user_2',
        'idea': 'Creating a mobile fitness app',
        'skills': ['React Native', 'Design']
    }],
    'top_k': 10
})

matches = response.json()
print(matches)
```

## ✅ What's Included

- ✅ Simple matching algorithm (TF-IDF based)
- ✅ RESTful API with FastAPI
- ✅ CORS support for frontend integration
- ✅ Comprehensive error handling
- ✅ API documentation (Swagger/OpenAPI)
- ✅ Production-ready configuration
- ✅ Integration examples and guides

## 📖 Documentation

- [README.md](README.md) - Full documentation
- [INTEGRATION.md](INTEGRATION.md) - Frontend/Backend integration guide
- [TEST_RESULTS.md](TEST_RESULTS.md) - Test results

