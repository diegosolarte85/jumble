# Jumble - Co-founder Matching Platform

Connecting business ideas and creators together.

## 🚀 Quick Deploy to Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

See [DEPLOY.md](./DEPLOY.md) for quick commands or [HEROKU_DEPLOYMENT.md](./HEROKU_DEPLOYMENT.md) for detailed instructions.

## Backend Setup

### Prerequisites

- Node.js 18+ and npm/pnpm
- SQLite3 (usually included with Node.js)
- Python 3.10+ with pip (for ML service)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp env.example .env.local
# Edit .env.local with your configuration
```

3. Generate database migrations:

```bash
npm run db:generate
```

4. Run migrations:

```bash
npm run db:push
```

5. (Optional) Seed the database with test data:

```bash
npx tsx scripts/seed.ts
```

### Running the Development Server

1. Start the Next.js backend:

```bash
npm run dev
```

2. (Optional) Start the Python ML service:

```bash
cd python-ml-service
pip install -r requirements.txt
python main.py
```

The backend API will be available at `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js endpoints

### Users

- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile
- `GET /api/users/[id]` - Get public user profile
- `POST /api/users/me/skills` - Add user skill
- `GET /api/users/me/skills` - Get user skills
- `DELETE /api/users/me/skills/[id]` - Remove user skill

### Skills

- `GET /api/skills` - List available skills (with optional category/search filters)
- `GET /api/skills/categories` - Get skill categories

### Startup Ideas

- `POST /api/ideas` - Create new startup idea
- `GET /api/ideas` - Get current user's ideas
- `GET /api/ideas/me` - Get current user's ideas
- `GET /api/ideas/[id]` - Get idea details
- `PUT /api/ideas/[id]` - Update startup idea
- `DELETE /api/ideas/[id]` - Delete startup idea

### Swipes & Matches

- `POST /api/swipes` - Record swipe action
- `GET /api/swipes` - Get swipe history
- `GET /api/matches` - Get all matches
- `GET /api/matches/[id]` - Get match details
- `DELETE /api/matches/[id]` - Unmatch users
- `GET /api/matches/recommendations` - Get match recommendations

### Messages

- `GET /api/matches/[id]/messages` - Get messages for a match
- `POST /api/matches/[id]/messages` - Send a message
- `GET /api/matches/[id]/messages/unread` - Get unread count
- `PUT /api/matches/[id]/messages/read` - Mark messages as read

### Health

- `GET /api/health` - Health check endpoint

## Database Schema

The database uses SQLite with the following main tables:

- `users` - User profiles
- `skills` - User skills with proficiency levels
- `startup_ideas` - Startup idea descriptions
- `swipes` - User swipe actions
- `matches` - Mutual matches between users
- `messages` - Chat messages

## ML Service

The Python ML service provides:

- `/embed/idea` - Generate embeddings for startup ideas
- `/embed/skills` - Generate embeddings for skills
- `/match/recommend` - Get ML-powered match recommendations

## Development

- Database migrations: `npm run db:generate` and `npm run db:push`
- Database studio: `npm run db:studio`
- Linting: `npm run lint`

## Project Structure

```
jumble/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   └── ...
├── drizzle/               # Database schema and migrations
├── lib/                   # Shared utilities
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # Database connection
│   ├── ml-client.ts      # ML service client
│   └── utils.ts          # Utility functions
├── python-ml-service/     # Python FastAPI ML service
├── scripts/               # Utility scripts
└── ...
```
