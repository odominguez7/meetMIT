<div align="center">

# meetMIT

**real connections, agentic precision.**

AI-powered campus connection platform that turns free moments into meaningful in-person meets.
Big Five personality matching. Agent-assisted scheduling. Feedback loops that learn.
Built for MIT and Harvard.

[![Next.js](https://img.shields.io/badge/Next.js_14-000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://prisma.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)

</div>

---

## The problem

Campus life is full of people you should know but never meet.

You walk past 500 people a day at MIT. Some share your research interests. Some are building the startup you'd join. Some just want a study partner who actually shows up. But the default social discovery tools are either too passive (hoping you bump into someone) or too performative (LinkedIn, mixers, forced networking events).

**The result:** Most meaningful campus connections happen by accident, not by design.

## The solution

meetMIT uses personality science and AI agents to create high-quality, low-friction micro-connections.

```
You:       Complete a 2-minute "Vibe Check" (10 questions)
meetMIT:   Maps your answers to Big Five (OCEAN) personality traits
meetMIT:   Finds people with 70%+ affinity match on campus
meetMIT:   Creates "Sparks" — 15-60 minute micro-meets (coffee, study, walk, brainstorm)
You:       Show up. Connect. Rate the experience.
meetMIT:   Learns from feedback. Next match is better.
```

No swiping. No profiles to curate. No pressure. Just show up.

---

## How it works

### Affinity matching

Users complete a 10-question "Vibe Check" mapped to the [Big Five (OCEAN)](https://en.wikipedia.org/wiki/Big_Five_personality_traits) personality model:

| Trait | Questions | What it measures |
|---|---|---|
| **O**penness | 1-2 | Curiosity, creativity, openness to new experiences |
| **C**onscientiousness | 5-6 | Organization, reliability, follow-through |
| **E**xtraversion | 3-4 | Energy from social interaction, spontaneity |
| **A**greeableness | 7-8 | Empathy, cooperation, trust |
| **N**euroticism | 9-10 (reversed) | Emotional stability, stress response |

Answers (1-5 scale) are normalized to 0-1 vectors. Matching uses **cosine similarity** between OCEAN vectors:

- **70%+ similarity** = core match (shared wavelength)
- **Strategic complements** = people who balance your weak spots (surfaced separately)

### Spark types

Seven types of micro-meets, each designed for a different energy level:

| Spark | Duration | Vibe |
|---|---|---|
| Study Sync | 30-60 min | Parallel focus work |
| Coffee Clash | 15-30 min | Quick 1:1 conversation |
| Lunch Link | 45-60 min | Meal + deeper conversation |
| Walk Wave | 15-30 min | Walking meeting |
| Homework Hack | 60 min | Collaborative problem-solving |
| Recess Rush | 15 min | Quick energy break |
| Blitz Brainstorm | 30 min | Rapid idea exchange |

### Feedback loops

After every meet, both people rate the experience (1-5) and indicate repeat interest. This data feeds back into the matching algorithm. The system gets smarter with every connection.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (React 18)                       │
│                                                             │
│  Landing · Onboarding · Sparks Feed · Offers Board          │
│  Insights Dashboard · Trust & Safety · Settings             │
│  AI Studio (Agent Simulation Viewer)                        │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST API (24 endpoints)
┌───────────────────────────▼─────────────────────────────────┐
│                    Next.js 14 (App Router)                    │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Zod         │  │  Affinity    │  │  Agent Runtime    │  │
│  │  Validation  │  │  Engine      │  │  (7 personas)     │  │
│  │              │  │              │  │                   │  │
│  │  All inputs  │  │  OCEAN       │  │  Registration     │  │
│  │  validated   │  │  cosine      │  │  Interaction      │  │
│  │  at boundary │  │  similarity  │  │  Observability    │  │
│  └──────────────┘  └──────────────┘  └───────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Prisma ORM + PostgreSQL 16                  │   │
│  │  users · sparks · commitments · feedback · offers     │   │
│  │  affinity_profiles · trust_reports · blocks · metrics │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Tech stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router, standalone output) |
| **Language** | TypeScript 5.7 (strict mode) |
| **Database** | PostgreSQL 16 + Prisma ORM |
| **UI** | React 18, Tailwind CSS, Framer Motion |
| **Validation** | Zod (all API inputs validated at boundary) |
| **Auth** | .edu email verification (MIT/Harvard only) |
| **Deployment** | Docker (multi-stage, non-root) + Google Cloud Run |

---

## Pages and features

| Page | What it does |
|---|---|
| `/` | Landing page with hero, how it works, spark types |
| `/onboarding` | 4-step wizard: email verification, vibe check, availability, confirmation |
| `/sparks` | Browse and filter spark opportunities with affinity scores |
| `/sparks/[id]` | Spark detail, commit to attend, post-meet feedback |
| `/offers` | Value exchange board ("I want X" / "I offer Y") |
| `/insights` | Campus-level aggregate analytics (no PII exposed) |
| `/trust` | Report safety incidents, block users |
| `/settings` | Automation level, notifications, visibility, account actions |
| `/ai-studio-room` | Agent simulation viewer (7 AI personas interacting) |

---

## API reference

### Users
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/users/verify-edu` | Verify .edu email, create/return user |
| POST | `/api/users/onboard` | Save preferences and availability modes |

### Affinity
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/affinity/profile` | Upload Big Five OCEAN personality scores |

### Sparks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/sparks/recommendations` | Personalized spark feed with affinity matching |
| POST | `/api/sparks/create` | Create a new spark opportunity |
| POST | `/api/sparks/[id]/commit` | Commit to attending a spark |
| POST | `/api/sparks/[id]/feedback` | Post-meet rating + repeat interest |

### Offers
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/offers/create` | List unfulfilled offers |
| POST | `/api/offers/create` | Post a value exchange offer |

### Trust & Safety
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/trust/report` | Report a safety incident |
| POST | `/api/trust/block` | Block a user from future matches |

### Insights
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/insights/campus` | Aggregate connection metrics (privacy-safe) |

### Agents
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/agents` | List all registered agents |
| POST | `/api/agents/register` | Register a new agent |
| GET | `/api/agents/[id]` | Agent details + reports |
| PATCH | `/api/agents/[id]/status` | Pause/resume agent |
| POST | `/api/agents/[id]/interact` | Send task to agent |
| GET | `/api/agents/[id]/activity` | Agent activity log (paginated) |
| POST | `/api/agents/[id]/report` | Report agent for abuse |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/observability` | Agent observability summary |
| GET | `/api/admin/activity-log` | System-wide activity log |
| GET | `/api/health` | Server health check |
| GET | `/api/health/db` | Database connectivity check |

---

## Quick start

### Local development

```bash
git clone https://github.com/odominguez7/meetMIT.git
cd meetMIT
npm install

# Start Postgres
docker compose up db -d

# Configure environment
cp .env.example .env

# Push schema and seed demo data
npx prisma db push
npm run db:seed

# Run dev server
npm run dev
```

Open [localhost:3000](http://localhost:3000). The seed creates 7 demo personas, 8 sparks, and 5 offers.

### Deploy to Cloud Run

```bash
# Build and push container
gcloud builds submit --tag gcr.io/PROJECT_ID/meetmit

# Deploy
gcloud run deploy meetmit \
  --image gcr.io/PROJECT_ID/meetmit \
  --platform managed \
  --region us-east1 \
  --set-env-vars DATABASE_URL="YOUR_CLOUD_SQL_URL" \
  --set-env-vars API_SECRET="$(openssl rand -hex 32)"
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `API_SECRET` | Prod only | Strong random string for token signing |
| `NEXT_PUBLIC_APP_URL` | No | Frontend URL (default: `http://localhost:3000`) |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` / `DB_SOCKET` | No | Cloud SQL Unix socket alternative |

---

## Database schema

10 models across identity, connections, trust, and analytics:

```
users ──────────── affinity_profiles (1:1, OCEAN scores)
  │
  ├── sparks ──────── spark_commitments (who's attending)
  │                    spark_feedbacks (post-meet ratings)
  │
  ├── offers (value exchange: "I want X / I offer Y")
  │
  ├── trust_reports (safety incidents)
  │
  ├── blocks (user-to-user blocking)
  │
  └── user_avail_modes (casual / study_only / founder_mode / zen_only)

connection_metrics (daily aggregates, no PII)
activities (system-wide event log)
```

---

## Project structure

```
app/
  page.tsx                 Landing page (hero + how it works)
  layout.tsx               Root layout + navigation
  onboarding/page.tsx      4-step onboarding wizard
  sparks/page.tsx          Browse spark opportunities
  sparks/[id]/page.tsx     Spark detail + commit + feedback
  offers/page.tsx          Value exchange board
  insights/page.tsx        Campus analytics dashboard
  trust/page.tsx           Safety controls + reporting
  settings/page.tsx        User preferences
  ai-studio-room/page.tsx  Agent simulation viewer
  api/                     24 REST endpoints (see API reference)

components/                Reusable React components
lib/
  db.ts                    Prisma client singleton (Cloud SQL support)
  schemas.ts               Zod validation schemas
  affinity.ts              OCEAN matching + vibe check scoring
  api.ts                   Response helpers
  agents-store.ts          Agent registry + activity log
  ai-simulation.ts         Agent simulation engine

prisma/
  schema.prisma            Full data model (10 models)
  seed.ts                  7 demo personas + 8 sparks + 5 offers
```

---

## The bigger picture

Campus connections shouldn't depend on luck.

The people who change your life at MIT aren't the ones in your section or your dorm. They're the ones you almost never meet because you're in different buildings, different schedules, different orbits. meetMIT closes that gap with personality science, not algorithms optimizing for engagement.

Every connection is real. Every meet is in person. Every match gets better because the system learns from what actually works. Not likes, not swipes, not followers. Just two people who showed up and had a conversation worth having.

**Real connections. Agentic precision.**

---

<div align="center">

**Built by [Omar](https://github.com/odominguez7) -- MIT Sloan '26**

</div>
