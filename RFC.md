# RFC: Startup Co-founder Matching Platform

## Summary
A Bumble-style matching platform that connects startup creators based on complementary skills and aligned business ideas using ML-powered recommendations.

## Motivation
Finding the right co-founder is one of the biggest challenges for entrepreneurs. Current solutions (LinkedIn, networking events, founder-matching sites) lack:
- Intelligent skill-gap analysis
- Idea alignment matching
- Modern, engaging UX
- Algorithmic compatibility scoring

This platform aims to solve co-founder discovery by combining dating-app UX patterns with ML-powered matching.

## Core Features

### Backend Requirements
- [ ] User authentication & profile management
- [ ] Skill taxonomy database (structured skill categories)
- [ ] Startup idea descriptions (free-form + categorized)
- [ ] ML-powered matching algorithm engine
- [ ] Real-time connection/chat system
- [ ] Match history and preferences storage

### ML Matching Algorithm
- [ ] Embed user skills using sentence transformers (e.g., `all-MiniLM-L6-v2`)
- [ ] Embed startup idea descriptions for semantic similarity
- [ ] Calculate idea alignment score (cosine similarity between idea embeddings)
- [ ] Filter for complementary, non-overlapping skills
- [ ] Score matches based on:
  - Idea similarity (0.6-0.9 range - aligned but not identical)
  - Skill complementarity (low overlap, high gap-filling)
  - Role compatibility (technical + business, design + engineering, etc.)
- [ ] Ranking algorithm to surface best matches first

### Frontend Requirements
- [ ] Swipeable card interface (Tinder/Bumble style)
  - Left swipe: Pass
  - Right swipe: Interested
  - Super like: Highly interested
- [ ] Rich profile pages displaying:
  - Startup idea pitch (elevator pitch format)
  - Required skills for the startup
  - User's current skills and experience
  - Previous projects/portfolio
  - Commitment level (full-time, part-time, weekends)
- [ ] Match notification and chat interface
- [ ] Discovery filters (location, commitment level, industry)
- [ ] Onboarding flow to build complete profiles

## Technical Questions & Decisions

### Platform Choice
**Decision Required:** Web app (React/Next.js) vs Mobile-first (React Native)?

**Considerations:**
- **Web (Next.js + React):**
  - ✅ Faster initial development
  - ✅ Better for desktop browsing/research
  - ✅ Easier deployment and iteration
  - ❌ Less engaging mobile experience
  
- **Mobile (React Native):**
  - ✅ Native feel, better for swipe mechanics
  - ✅ Push notifications for matches
  - ✅ More engaging user experience
  - ❌ Slower development, need to handle iOS/Android

**Recommendation:** Start with web (Next.js) for MVP, plan React Native migration after validation.

### Architecture Components

#### Tech Stack (Proposed)
- **Frontend:** React + Next.js 14 (App Router)
- **Backend:** Next.js API Routes or separate Node.js/Python service
- **Database:** PostgreSQL (user data) + Vector DB (Pinecone/Weaviate for embeddings)
- **ML:** Python service with HuggingFace Transformers
- **Real-time:** WebSockets or Supabase Realtime
- **Auth:** NextAuth.js or Clerk
- **Hosting:** Vercel (frontend) + Railway/Render (backend services)

## Implementation Phases

### Phase 1: Core MVP (Weeks 1-4)
**Issues:**
- [ ] #1: Set up Next.js project with TypeScript and Tailwind
- [ ] #2: Design and implement database schema
- [ ] #3: Build user authentication flow
- [ ] #4: Create profile creation/editing UI
- [ ] #5: Implement basic skill taxonomy
- [ ] #6: Build swipeable card interface
- [ ] #7: Create simple matching logic (manual matching without ML)

### Phase 2: ML Matching (Weeks 5-8)
**Issues:**
- [ ] #8: Set up Python ML service with sentence transformers
- [ ] #9: Implement idea embedding pipeline
- [ ] #10: Implement skill embedding and comparison
- [ ] #11: Build matching algorithm with scoring system
- [ ] #12: Create API endpoints for match recommendations
- [ ] #13: Integrate ML matches into frontend
- [ ] #14: Add match explanation UI ("Why this match?")

### Phase 3: Communication (Weeks 9-10)
**Issues:**
- [ ] #15: Implement chat/messaging system
- [ ] #16: Build match notification system
- [ ] #17: Create conversation starters based on shared interests
- [ ] #18: Add video call integration (optional)

### Phase 4: Polish & Launch (Weeks 11-12)
**Issues:**
- [ ] #19: Implement user feedback and rating system
- [ ] #20: Add reporting and moderation tools
- [ ] #21: Create onboarding tutorial
- [ ] #22: Build analytics dashboard
- [ ] #23: Performance optimization and testing
- [ ] #24: Beta launch and user testing

## Database Schema (Draft)

```sql
-- Users table
users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  name VARCHAR,
  bio TEXT,
  location VARCHAR,
  commitment_level ENUM('fulltime', 'parttime', 'weekends'),
  created_at TIMESTAMP
)

-- Skills table
skills (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users,
  skill_name VARCHAR,
  proficiency_level ENUM('beginner', 'intermediate', 'expert'),
  skill_embedding VECTOR(384)  -- For ML matching
)

-- Startup ideas table
startup_ideas (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users,
  title VARCHAR,
  description TEXT,
  industry VARCHAR,
  required_skills JSONB,
  idea_embedding VECTOR(384),  -- For ML matching
  stage ENUM('idea', 'mvp', 'launched')
)

-- Swipes table
swipes (
  id UUID PRIMARY KEY,
  swiper_id UUID REFERENCES users,
  swiped_id UUID REFERENCES users,
  direction ENUM('left', 'right', 'super'),
  created_at TIMESTAMP
)

-- Matches table
matches (
  id UUID PRIMARY KEY,
  user1_id UUID REFERENCES users,
  user2_id UUID REFERENCES users,
  match_score FLOAT,
  created_at TIMESTAMP,
  last_message_at TIMESTAMP
)

-- Messages table
messages (
  id UUID PRIMARY KEY,
  match_id UUID REFERENCES matches,
  sender_id UUID REFERENCES users,
  content TEXT,
  created_at TIMESTAMP
)
```

## Open Questions
1. Should we allow users to have multiple startup ideas active simultaneously?
2. What's the minimum viable profile (required fields before matching)?
3. How do we handle equity/compensation discussions?
4. Should matches expire if no communication happens within X days?
5. Premium features? (unlimited swipes, see who liked you, etc.)
6. How do we verify skills/experience?

## Success Metrics
- User sign-ups per week
- Profile completion rate
- Average swipes per user
- Match rate (% of right swipes that become matches)
- Conversation initiation rate
- Successful partnerships formed (self-reported)

## Next Steps
1. **Decide:** Web vs Mobile-first
2. **Build:** Database schema prototype
3. **Design:** Create mockups for key screens
4. **Prototype:** Build swipe interface demo
5. **Validate:** Test matching algorithm with synthetic data

---

**Author:** [Your Name]  
**Date:** 2025-12-06  
**Status:** Draft - Awaiting Feedback