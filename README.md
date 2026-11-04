# ByteCraft AI

> An adaptive micro-learning web platform engineered with Next.js, MongoDB, and LLM-driven personalized curriculum generation.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## Overview

ByteCraft AI is a fullstack adaptive learning application designed to solve retention drop-off in online education by providing modular, 2-to-15 minute interactive lessons. The platform dynamically generates custom curriculum on demand, continuously calibrates difficulty based on historical quiz performance, and incorporates gamification mechanics (streaks, badges, and daily quests) to sustain learner engagement.

---

## System Architecture

```text
               +-------------------------------------------+
               |             Client Interface              |
               |       (Next.js 15 / React 19 / CSS)       |
               +---------------------+---------------------+
                                     |
                                     | REST (JSON / Bearer JWT)
                                     v
               +-------------------------------------------+
               |       Next.js Serverless API Layer        |
               |           (Route Handlers / App)          |
               +----------+--------------------+-----------+
                          |                    |
        Database Calls    |                    | Inference Calls
        (Pooled Driver)   |                    | (OpenAI-compatible)
                          v                    v
              +-------------------+    +-------------------+
              |   MongoDB Atlas   |    | Google Gemini API |
              |  Document Store   |    |  (2.5 Flash / LLM)|
              +-------------------+    +-------------------+
```

---

## Key Engineering Features

### 1. Dynamic Adaptive Difficulty Engine
The recommendation pipeline evaluates a learner's rolling quiz history across completed lessons:
- If a user's average accuracy drops below **50%**, target difficulty steps down (e.g., `Advanced` &rarr; `Intermediate` &rarr; `Beginner`) to build foundational comprehension.
- If accuracy exceeds **80%**, the system elevates target difficulty to maintain appropriate challenge and reduce cognitive boredom.
- Fallback caching ensures lessons are served from pre-indexed document collections if external LLM generation thresholds latency limits.

### 2. Structured Content Generation with Strict Schemas
Lesson generation utilizes constrained JSON object enforcement (`response_format: { type: "json_object" }`). Content and evaluation outputs are strictly parsed and validated before persistence into MongoDB, eliminating malformed markdown or corrupted quiz structures.

### 3. Serverless Connection Pooling
MongoDB client instances are cached across hot lambdas in production via `global._mongoClientPromise`, preventing socket exhaustion during high concurrent request spikes.

### 4. Idempotent Quiz Evaluation & Progression
Submitting quiz attempts performs an atomic sequence:
- Evaluates individual answer choices through either semantic LLM grading or key-index fallback.
- Computes XP rewards (base + perfect score bonuses).
- Updates daily streak counters taking into account local calendar boundaries.
- Upserts the lesson progress record to avoid duplicate progress entries.

---

## Database Schemas

The database contains 5 core collections in MongoDB:

| Collection | Description | Key Indexes |
|---|---|---|
| `users` | User credentials, preferences, XP, streak, and onboarding state | `email (unique)` |
| `lessons` | Generated micro-lessons with markdown bodies and MCQ arrays | `topic`, `difficulty`, `duration` |
| `progress` | Completed lesson records, score percentage, and timestamps | `user_id`, `lesson_id` |
| `sessions` | Granular time spent per learning interval for analytics | `user_id`, `date` |
| `quests` | Daily user objectives with dynamic target values | `user_id`, `date` |

---

## API Reference

### Authentication
- `POST /api/auth/register` - Create user credentials and issue initial JWT.
- `POST /api/auth/login` - Authenticate credentials and return JWT bearer token.
- `GET /api/auth/me` - Retrieve current session user profile.
- `POST /api/auth/onboarding` - Update initial learning interests and baseline tier.

### Core Learning
- `GET /api/lessons` - Retrieve lessons with optional `topic`, `difficulty`, and `limit` queries.
- `GET /api/lessons/:id` - Fetch single lesson document by ID.
- `POST /api/recommend` - Generate customized lessons based on available time and adaptive score.
- `POST /api/submit-quiz` - Submit answers, evaluate score, and update user progression.
- `GET /api/continue` - Retrieve the next recommended uncompleted lesson for active user.

### Analytics & Gamification
- `GET /api/dashboard/all` - Aggregate dashboard metrics, active daily quests, and badges.
- `GET /api/gamification/badges` - Fetch unlocked and locked accomplishment badges.
- `GET /api/gamification/quests` - Fetch today's dynamic learning objectives.
- `POST /api/progress` - Record reading duration and completion status.

---

## Directory Structure

```text
├── app/
│   ├── api/                     # REST API Route Handlers
│   │   ├── auth/                # Authentication endpoints
│   │   ├── dashboard/           # Metrics and aggregations
│   │   ├── gamification/        # Badges and daily quests
│   │   ├── lessons/             # Lesson querying and retrieval
│   │   ├── recommend/           # Adaptive recommendation pipeline
│   │   └── submit-quiz/         # Quiz evaluation and XP calculation
│   ├── dashboard/               # Analytics & progression page
│   ├── home/                    # Topic selection & lesson feed
│   ├── lesson/[id]/             # Interactive reader view
│   ├── login/                   # User sign-in
│   ├── onboarding/              # User preferences initialization
│   ├── quiz/[id]/               # Interactive assessment interface
│   ├── register/                # User account creation
│   ├── globals.css              # Global styling & design tokens
│   ├── layout.jsx               # Root provider and layout wrapper
│   └── page.jsx                 # Dynamic gateway routing
├── components/                  # Reusable UI components (Navbar, etc.)
├── context/                     # React Context (AuthContext)
├── lib/
│   ├── api.js                   # Client HTTP Axios instance
│   ├── auth.js                  # JWT signing, verification, and bcrypt hashing
│   ├── dashboard.js             # Data aggregation helpers
│   ├── gamification.js          # Badge logic and quest initialization
│   ├── gemini.js                # LLM client & structured prompt definitions
│   └── mongodb.js               # Cached serverless MongoDB client
├── public/                      # Static assets
├── .env.example                 # Environment variable template
├── next.config.mjs              # Next.js runtime configuration
├── package.json                 # Project dependencies & scripts
└── postcss.config.mjs           # PostCSS configuration
```

---

## Local Development

### 1. Prerequisites
- Node.js `v18.17+` or `v20+`
- MongoDB Atlas cluster or local MongoDB instance
- Google Gemini API key

### 2. Setup
Clone the repository:
```bash
git clone https://github.com/<your-username>/bytecraft-ai.git
cd bytecraft-ai
```

Install dependencies:
```bash
npm install
```

Configure environment variables:
```bash
cp .env.example .env.local
```
Fill in `.env.local`:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET=your_secure_jwt_secret_token
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

### 3. Run Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000`.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## Deployment to Vercel

This application is built for native deployment on [Vercel](https://vercel.com/):

1. Import your Git repository into Vercel.
2. In **Environment Variables**, define:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `GEMINI_API_KEY`
3. Click **Deploy**. Vercel automatically deploys both client pages and serverless API endpoints under a single domain.

---

## License

This project is licensed under the [MIT License](LICENSE).
