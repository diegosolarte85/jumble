# Backend Implementation Plan

## Overview

Implement the backend for the startup co-founder matching platform using Next.js API Routes (App Router), SQLite database, and a separate Python ML service for matching algorithms.

## Architecture

- **Backend API**: Next.js 14 API Routes (App Router)
- **Database**: SQLite (local development, easy to migrate to PostgreSQL later)
- **Vector Storage**: Store embeddings as JSON arrays in SQLite TEXT columns
- **ML Service**: Separate Python FastAPI service for embeddings and matching
- **Auth**: NextAuth.js v5 (Auth.js)
- **Real-time**: WebSockets via Socket.io or Server-Sent Events (Phase 3)

## Database Schema Implementation

### Core Tables

- `users` - User profiles and authentication data
- `skills` - User skills with proficiency levels (embeddings stored as JSON TEXT)
- `startup_ideas` - Startup idea descriptions (embeddings stored as JSON TEXT)
- `swipes` - User swipe actions (left/right/super)
- `matches` - Mutual matches between users
- `messages` - Chat messages between matched users

### Setup Tasks

1. Initialize SQLite database file (e.g., `jumble.db`)
2. Create migration files using Drizzle ORM
3. Implement schema from RFC with proper indexes for performance
4. Store embeddings as JSON arrays in TEXT columns (384 dimensions as JSON array)
5. Consider Pinecone/Weaviate integration for production vector search (optional)

## Authentication & User Management

### NextAuth.js Setup

- Configure NextAuth.js v5 with email/password and OAuth providers
- Create user registration endpoint (`POST /api/auth/register`)
- Implement profile creation/update endpoints (`GET/PUT /api/users/[id]`)
- Add middleware for protected routes

### User Profile API

- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update user profile
- `GET /api/users/[id]` - Get public user profile
- `POST /api/users/me/skills` - Add/update user skills
- `DELETE /api/users/me/skills/[id]` - Remove skill

## Skill Taxonomy & Management

### Skill System

- Create skill taxonomy seed data (categories: Technical, Business, Design, Marketing, etc.)
- `GET /api/skills` - List all available skills with categories
- `GET /api/skills/categories` - Get skill categories
- Implement skill search/autocomplete endpoint

## Startup Ideas API

### Idea Management

- `POST /api/ideas` - Create new startup idea
- `GET /api/ideas/me` - Get current user's ideas
- `PUT /api/ideas/[id]` - Update startup idea
- `DELETE /api/ideas/[id]` - Delete startup idea
- `GET /api/ideas/[id]` - Get idea details (public)

## ML Matching Service (Python)

### Python FastAPI Service

- Set up FastAPI service with HuggingFace Transformers
- Implement embedding endpoints:
  - `POST /embed/idea` - Generate idea embeddings
  - `POST /embed/skills` - Generate skill embeddings
- Implement matching endpoint:
  - `POST /match/recommend` - Get match recommendations for a user
- Use `all-MiniLM-L6-v2` model (384 dimensions)
- Calculate cosine similarity for idea alignment
- Implement skill complementarity scoring

### Integration

- Create Next.js API route wrapper: `GET /api/matches/recommendations`
- Queue embedding generation when users create/update ideas or skills
- Cache embeddings in SQLite TEXT columns (as JSON)

## Matching & Swipe System

### Swipe API

- `POST /api/swipes` - Record swipe action (left/right/super)
- `GET /api/swipes` - Get user's swipe history
- Implement mutual match detection (when both users swipe right)

### Match API

- `GET /api/matches` - Get all matches for current user
- `GET /api/matches/[id]` - Get specific match details
- `DELETE /api/matches/[id]` - Unmatch users
- Calculate and store match scores when mutual match occurs

## Real-time Chat System

### Messaging API

- `GET /api/matches/[id]/messages` - Get messages for a match
- `POST /api/matches/[id]/messages` - Send a message
- `GET /api/matches/[id]/messages/unread` - Get unread count
- `PUT /api/matches/[id]/messages/read` - Mark messages as read

### Real-time Implementation (Phase 3)

- Set up Socket.io server in Next.js API route
- Create WebSocket namespace for match conversations
- Implement message broadcasting to connected clients
- Add typing indicators and online status

## API Structure

```
/api
  /auth
    /register
    /[...nextauth]
  /users
    /me
    /[id]
    /me/skills
      /[id]
  /skills
    /categories
  /ideas
    /me
    /[id]
  /swipes
  /matches
    /recommendations
    /[id]
      /messages
        /unread
        /read
  /health
```

## Development Setup

### Prerequisites

- Node.js 18+ and npm/pnpm
- SQLite3 (usually included with Node.js)
- Python 3.10+ with pip

### Initial Setup Tasks

1. Initialize Next.js project with TypeScript
2. Set up database connection using Drizzle ORM
3. Configure environment variables (.env.local)
4. Set up Python ML service with FastAPI
5. Create database migrations
6. Implement seed scripts for skill taxonomy

## Key Files Created

- `drizzle/schema.ts` - Database schema
- `lib/db.ts` - SQLite database connection
- `lib/auth.ts` - NextAuth configuration
- `app/api/**/*.ts` - API route handlers
- `lib/ml-client.ts` - Python ML service client
- `python-ml-service/main.py` - FastAPI ML service
- `python-ml-service/requirements.txt` - Python dependencies
- `env.example` - Environment variables template

## Phase 1 Priorities (MVP) - COMPLETED

1. ✅ Database schema and migrations
2. ✅ User authentication (NextAuth.js)
3. ✅ User profile CRUD endpoints
4. ✅ Skill taxonomy and user skills endpoints
5. ✅ Startup idea CRUD endpoints
6. ✅ Basic swipe system (without ML matching)
7. ✅ Match detection (mutual swipes)
8. ✅ Basic messaging endpoints (without real-time)

## Phase 2 Priorities (ML Integration)

1. ✅ Python ML service setup
2. ✅ Embedding generation endpoints
3. ✅ Match recommendation algorithm
4. ⏳ Integration with Next.js API (basic integration done, full ML-powered recommendations pending)
5. ⏳ Match scoring and ranking (algorithm ready, needs full integration)

## Phase 3 Priorities (Real-time)

1. ⏳ WebSocket server setup
2. ⏳ Real-time messaging
3. ⏳ Online status tracking
4. ⏳ Push notifications (optional)

## Implementation Status

### Completed
- All Phase 1 MVP features
- Database schema with SQLite
- Authentication system
- All CRUD endpoints for users, skills, and ideas
- Swipe and match system
- Messaging endpoints
- Python ML service with matching algorithm
- ML client integration

### Pending
- Full ML-powered match recommendations integration
- Real-time messaging with WebSockets
- Production optimizations
- Vector database integration (optional)

