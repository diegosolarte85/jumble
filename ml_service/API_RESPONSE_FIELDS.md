# API Response Fields

## Match Response Structure

The API now returns comprehensive match information including:

### Top-Level Match Fields

- **`user_id`**: Unique identifier of the matched user
- **`match_score`**: Overall match score (0-1, higher is better)
- **`connection_strength`**: Strength of connection (0-100 scale)
  - 0-30: Weak connection
  - 30-60: Moderate connection
  - 60-80: Strong connection
  - 80-100: Very strong connection
- **`success_probability`**: Probability of successful partnership (0-1)
  - 0.0-0.3: Low probability
  - 0.3-0.6: Moderate probability
  - 0.6-0.8: High probability
  - 0.8-1.0: Very high probability
- **`match_characteristics`**: Array of key characteristics that make this a good match
  - Examples: "Strong idea alignment", "Complementary roles (technical + design)", "Low skill overlap (diverse expertise)"
- **`explanation`**: Detailed breakdown of match components
- **`user_profile`**: Full profile of the matched user

### Example Response

```json
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
    "required_skills": ["Backend Development", "Machine Learning"]
  }
}
```

## Match Characteristics

The `match_characteristics` array provides human-readable explanations of why a match is good. Possible characteristics include:

### Idea Alignment
- "Excellent idea alignment"
- "Strong idea alignment"
- "Good idea similarity"
- "Ideas are aligned but not identical (ideal range)"

### Skill Complementarity
- "Strong skill complementarity"
- "Good skill fit"
- "Skills effectively fill each other's gaps"

### Skill Diversity
- "Low skill overlap (diverse expertise)"
- "Moderate skill overlap (balanced diversity)"

### Role Compatibility
- "Complementary roles (technical + design)"
- "High role compatibility"
- "Good role compatibility"

### Overall Quality
- "Strong match across all dimensions"

## Usage in Frontend

```typescript
// Display connection strength
<div>Connection: {match.connection_strength}/100</div>

// Display success probability
<div>Success Rate: {(match.success_probability * 100).toFixed(1)}%</div>

// Display match characteristics
<div>
  <h4>Why this is a good match:</h4>
  <ul>
    {match.match_characteristics.map((char, idx) => (
      <li key={idx}>{char}</li>
    ))}
  </ul>
</div>
```

## Usage in Backend

```python
# Access connection strength
connection_strength = match['connection_strength']

# Access success probability
success_prob = match['success_probability']

# Access match characteristics
characteristics = match['match_characteristics']
for char in characteristics:
    print(f"Match strength: {char}")
```

