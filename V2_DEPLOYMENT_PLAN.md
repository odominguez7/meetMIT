# meetMIT V2 — Step-by-Step Deployment Plan

> **Status**: Ready to execute · **Estimated phases**: 8 · **Target**: 100% V2 spec compliance
> **Starting point**: Next.js 14 + Prisma/PostgreSQL monolith
> **End state**: React SPA (Vite) + Express API + Firestore + Redis + Firebase Auth

---

## Delta Analysis: V1 → V2

| Dimension | V1 (Current) | V2 (Target) | Migration Impact |
|-----------|-------------|-------------|------------------|
| **Frontend** | Next.js 14 (SSR) | React 18 + Vite (SPA) | Full rewrite — new project scaffold |
| **Backend** | Next.js API routes | Express.js on Cloud Run | Full rewrite — standalone server |
| **Database** | PostgreSQL + Prisma | Firestore (NoSQL) | Full migration — new data layer |
| **Cache** | None | Redis (Memorystore) | New addition |
| **Auth** | Custom `.edu` verify | Firebase Auth (magic link) | Replace entirely |
| **Maps** | None | Google Maps JS API | New addition |
| **Agents** | None | Full agentic layer (HW3) | New addition — critical |
| **Real-time** | None | WebSocket presence | New addition |
| **AI** | None | Anthropic Claude (Sonnet) | New addition |
| **Styling** | Tailwind (spark/night palette) | Tailwind (MIT midnight palette) | Retheme |
| **Fonts** | system-ui fallbacks | Syne + Instrument Sans + IBM Plex Mono | Replace |
| **Tabs** | 5 (Sparks, Offers, Insights, Trust, Settings) | 6 (Sparks, Map, Offers, Agents, Trust, You) | Restructure |

**Files to keep/adapt**: `lib/affinity.ts` logic (OCEAN scoring), `components/VibeCheck.tsx` (quiz structure), `components/SparkCard.tsx` (card pattern)
**Files to discard**: All Prisma models, all Next.js API routes, all Next.js page components, `lib/db.ts`

---

## Phase 0: Project Scaffold & Infrastructure

**Goal**: New monorepo structure with client + server, all configs ready.

### Steps

#### 0.1 — Create directory structure
```
meetmit/
├── client/               # React + Vite SPA
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── server/               # Express API
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── config/
│   ├── index.js
│   └── package.json
│
├── shared/               # Shared constants
│   ├── meetTypes.js
│   ├── oceanTraits.js
│   └── errorCodes.js
│
├── Dockerfile
├── .env.development
├── .env.production
└── README.md
```

#### 0.2 — Initialize client package
```bash
cd client/
npm init -y
npm install react@18 react-dom@18 react-router-dom@6 framer-motion @googlemaps/js-api-loader firebase
npm install -D vite @vitejs/plugin-react tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

#### 0.3 — Initialize server package
```bash
cd server/
npm init -y
npm install express cors firebase-admin ioredis axios uuid jsonwebtoken helmet
npm install -D nodemon
```

#### 0.4 — Create `vite.config.js`
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:8080', '/ws': { target: 'ws://localhost:8080', ws: true } } },
  build: { outDir: 'dist' }
});
```

#### 0.5 — Create `Dockerfile` (unified build)
```dockerfile
FROM node:20-slim AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

FROM node:20-slim AS server
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ .
COPY --from=client-build /app/client/dist ./public
EXPOSE 8080
CMD ["node", "index.js"]
```

#### 0.6 — Create `server/index.js` (express entry with static serving)
- Express app on `PORT` (default 8080)
- Serve `./public` for SPA static files
- SPA fallback: `GET *` → `public/index.html`
- Mount all API routers under `/api`
- WebSocket server on `/ws/presence`

#### 0.7 — Create shared constants
- `shared/meetTypes.js` — spark types, offer categories, availability modes
- `shared/oceanTraits.js` — OCEAN trait names, quiz questions (port from V1 `VibeCheck.tsx`)
- `shared/errorCodes.js` — standardized error codes (`rate_limit_exceeded`, `agent_not_found`, etc.)

#### Validation checkpoint
- [ ] `cd client && npm run dev` shows blank React app
- [ ] `cd server && node index.js` starts on :8080
- [ ] Dockerfile builds and runs locally

---

## Phase 1: Design System & App Shell

**Goal**: Tailwind theme, fonts, global styles, tab navigation, dark mode.

### Steps

#### 1.1 — Tailwind config with V2 palette
```javascript
// client/tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        midnight: '#0D1117',
        surface: '#161B22',
        'surface-2': '#21262D',
        border: '#30363D',
        'mit-red': '#A31F34',
        'mit-red-glow': '#E8364F',
        'mit-gray': '#8A8B8C',
        'spark-gold': '#F0B429',
        'trust-green': '#2EA043',
        'alert-orange': '#D29922',
        'text-primary': '#E6EDF3',
        'text-muted': '#7D8590',
        'text-link': '#58A6FF',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['Instrument Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      }
    }
  }
};
```

#### 1.2 — Global CSS (`client/src/styles/globals.css`)
- Tailwind directives (`@tailwind base/components/utilities`)
- Google Fonts imports (Syne, Instrument Sans, IBM Plex Mono)
- CSS custom properties matching the V2 spec `:root` block
- Dark mode body defaults: `bg-midnight text-text-primary`

#### 1.3 — `App.jsx` with React Router
```
Routes:
  /                → Sparks (home)
  /map             → Map
  /offers          → Offers
  /agents          → Agents directory
  /agents/register → Agent registration
  /agents/:id      → Agent detail
  /agents/admin    → Agent admin/observability
  /trust           → Trust
  /profile         → You (profile)
  /onboarding      → Onboarding flow
```

#### 1.4 — `NavTabs.jsx` — Bottom tab bar (mobile-first)
- 6 tabs: Sparks, Map, Offers, Agents, Trust, You
- Active tab → `mit-red` fill
- Framer Motion tab indicator animation

#### 1.5 — Component primitives
- `Card.jsx` — `surface` bg, `border`, 12px radius, hover lift
- `Button.jsx` — primary (`mit-red`), ghost, sizes
- `Chip.jsx` — pill-shaped filter tag, active/inactive states
- `Avatar.jsx` — 48px circle, optional `trust-green` ring
- `MatchScore.jsx` — circular progress ring, `spark-gold`, mono font percentage
- `Toast.jsx` — slide-in notification, auto-dismiss

#### Validation checkpoint
- [ ] App loads with dark theme, correct fonts, tab navigation works
- [ ] All 6 routes render placeholder pages
- [ ] Cards, buttons, chips render correctly

---

## Phase 2: Firebase Auth & Onboarding

**Goal**: MIT `.edu` magic link auth, JWT session, full onboarding flow.

### Steps

#### 2.1 — Firebase project setup
- Create Firebase project `meetmit-prod` (or reuse existing)
- Enable Authentication → Email link (passwordless) sign-in method
- Add authorized domain: `meetmit-api-114661584115.us-east1.run.app`
- Get Firebase config (apiKey, authDomain, projectId)

#### 2.2 — `server/config/firebase.js`
- Initialize `firebase-admin` with service account
- Export `admin`, `db` (Firestore), `auth` (Firebase Auth)

#### 2.3 — `client/src/utils/firebase.js`
- Initialize Firebase client SDK with config
- Export `auth`, `sendSignInLinkToEmail`, `isSignInWithEmailLink`, `signInWithEmailLink`

#### 2.4 — Auth API routes (`server/routes/auth.js`)
```
POST /api/auth/verify-mit    → Validate email is @mit.edu or @college.harvard.edu
                               → Send magic link via Firebase
POST /api/auth/confirm       → Verify magic link token → issue JWT (1h expiry)
POST /api/auth/refresh       → Refresh JWT (7d refresh token)
DELETE /api/auth/logout       → Invalidate session in Redis
```

#### 2.5 — `server/middleware/authMiddleware.js`
- Extract `Bearer` token from `Authorization` header
- Verify JWT → attach `req.user = { uid, email }`
- 401 on invalid/expired token

#### 2.6 — `client/src/hooks/useAuth.js`
- React context + hook for auth state
- `login(email)`, `confirmLink()`, `logout()`, `user`, `loading`
- Persist JWT in `localStorage`, auto-refresh

#### 2.7 — Onboarding flow (`client/src/pages/Onboarding.jsx`)
Six steps, each a swipeable/animated panel:
1. **Landing**: Headline + "Sign in with MIT email" button
2. **Verify**: Magic link sent, waiting state with "Check your inbox"
3. **Quick Profile**: Name, photo upload (optional), department dropdown, year, bio (140 chars)
4. **Vibe Check**: Port from V1 `VibeCheck.tsx` — 10 questions, 5-point slider, progress bar, radar chart result
5. **Set Your Mode**: Availability radio chips + automation slider + calendar connect (optional)
6. **Done**: Welcome message → redirect to `/` (Sparks)

#### 2.8 — Profile API routes (`server/routes/profile.js`)
```
GET  /api/profile              → Get current user doc from Firestore `users` collection
PUT  /api/profile              → Update profile fields
POST /api/profile/vibe-check   → Submit 10 answers → compute OCEAN → store in user doc
GET  /api/profile/vibe         → Return OCEAN scores for radar chart
```

#### 2.9 — Firestore security rules
- Users can only read/write their own `users/{uid}` document
- Agents collection: read-all, write only with valid agent_token
- Activity log: read-only for admins, write from server only

#### Validation checkpoint
- [ ] Can send magic link to @mit.edu email
- [ ] Magic link confirms → JWT issued → user created in Firestore
- [ ] Onboarding flow completes → user doc has OCEAN scores + profile
- [ ] Protected routes redirect to onboarding if no auth

---

## Phase 3: Sparks Tab (Core Matching Engine)

**Goal**: Affinity engine, card feed with accept/reshuffle, match sessions with feedback.

### Steps

#### 3.1 — Affinity engine (`server/services/affinityEngine.js`)
Port and enhance V1 `lib/affinity.ts`:
```
computeAffinity(userA, userB):
  - OCEAN similarity (55% weight) — cosine similarity on 4 traits
  - Neuroticism stability bonus (10%)
  - Strategic complements bonus (5% each condition)
  - Calendar overlap score (20%) — computeCalendarOverlap()
  - Historical feedback boost (10%) — getHistoricalFeedback()
  → Return 0-99 score
```

#### 3.2 — Matchmaker service (`server/services/matchmaker.js`)
- `getRankedMatches(userId, filters, limit)`:
  - Fetch all active users (exclude blocked, self)
  - Apply filters: type, time, energy level
  - Score each with affinity engine
  - Sort descending, return top `limit`
  - Include suggested location + suggested time from calendar overlap

#### 3.3 — Sparks API routes (`server/routes/sparks.js`)
```
GET  /api/sparks                      → Ranked matches (query: filter, limit)
POST /api/sparks/:matchId/accept      → Accept match → create session in `matches` collection
POST /api/sparks/:matchId/reshuffle   → Mark skipped → return next match
GET  /api/sparks/history              → Past matches for current user
```

#### 3.4 — Session management API (`server/routes/sessions.js`)
```
GET    /api/sessions              → Active + upcoming sessions for current user
GET    /api/sessions/:id          → Session detail (participants, location, time)
POST   /api/sessions/:id/feedback → Post-meet rating (1-5) + notes → update match doc
DELETE /api/sessions/:id          → Cancel session → update status
```

#### 3.5 — `SparkCard.jsx` component (port + enhance from V1)
- Card anatomy per V2 spec: avatar, name, department, vibe match %, OCEAN bar, quote, location+time
- "Reshuffle" button (left) + "MeetMIT" button (right)
- Framer Motion: swipe gestures, stagger animation for card stack
- Tap → expand detail view (full OCEAN radar, mutual interests, suggested topics)

#### 3.6 — `VibeRadar.jsx` component
- Radar/pentagon chart for OCEAN scores
- Use SVG or canvas — keep lightweight, no heavy chart library

#### 3.7 — `Sparks.jsx` page
- Filter chips rail (horizontally scrollable): All, Tonight, Study, Coffee, Founder, Mentor, Walk, Group, Low-energy, Lab-buddy
- Vertical card stack (Framer Motion `AnimatePresence`)
- FAB button (+) → "Post a MeetMIT Request" (links to Offers)
- `useSparks.js` hook: fetch, filter, accept, reshuffle state management

#### Validation checkpoint
- [ ] GET /api/sparks returns ranked matches with affinity scores
- [ ] Cards render with correct data, animations work
- [ ] Accept → creates session in Firestore
- [ ] Reshuffle → new card animates in
- [ ] Feedback submission updates match doc

---

## Phase 4: Offers Tab (Value Exchange Board)

**Goal**: Full CRUD marketplace for want/offer posts.

### Steps

#### 4.1 — Offers API routes (`server/routes/offers.js`)
```
GET    /api/offers               → List offers (filters: category, time, campus area, sort)
POST   /api/offers               → Create offer (want, offer, category, location_pref, available_window)
PUT    /api/offers/:id           → Edit offer (author only)
DELETE /api/offers/:id           → Remove offer (author only)
POST   /api/offers/:id/accept   → Accept offer → create session
```
Sort options: `newest`, `expiring_soon`, `highest_vibe`, `most_popular`

#### 4.2 — `OfferCard.jsx` component (port + enhance from V1)
- Display: WANT section, OFFER section, author info, time, location, accept/message buttons
- Categories: Study Help, Founder Feedback, Mentorship, Code Review, Design Critique, Career Advice, Pizza Deal, Coffee Chat, Meditation, Fitness Buddy

#### 4.3 — `Offers.jsx` page
- Category filter chips
- Sort dropdown
- Card grid/list layout
- "Post an Offer" FAB/button → modal or inline form
- `useOffers.js` hook (CRUD + filters)

#### Validation checkpoint
- [ ] Create, read, update, delete offers works
- [ ] Filters and sorting work
- [ ] Accept offer creates a session

---

## Phase 5: Agents Tab (HW3 — CRITICAL)

**Goal**: Full agent registration, directory, interaction, rate limiting, moderation, observability.

> **This phase is the most critical for HW3 compliance. Every sub-step must be verified.**

### Steps

#### 5.1 — Redis setup (`server/config/redis.js`)
- Connect to Redis (Memorystore in prod, local Redis in dev)
- Export `redis` client instance
- Use for: rate limiting, session cache, presence tracking, idempotency cache

#### 5.2 — Rate limiting middleware (`server/middleware/rateLimiter.js`)
Two middlewares:
```
agentRateLimit(req, res, next):
  - Key: rate:agent:{agentId}:{minute}
  - Limit: 10 messages/minute
  - On exceed: 429 { error: "rate_limit_exceeded", retry_after: 60 }
  - Log to activity_log

userRateLimit(req, res, next):
  - Key: rate:user:{uid}:{minute}
  - Limit: 30 messages/minute
  - On exceed: 429 { error: "rate_limit_exceeded" }
```
Per-session limit (50/session) and per-day limit (100/day) also tracked.

#### 5.3 — Agent auth middleware (`server/middleware/agentAuth.js`)
- Validate `agent_token` from `Authorization: Bearer agnt_xxx` header
- Fetch agent doc from Firestore, verify status is `active`
- Attach `req.agent = { id, name, capabilities, endpoint }`

#### 5.4 — Activity logger service (`server/services/activityLogger.js`)
```
logActivity(actorType, actorId, action, details):
  → Write to Firestore `activity_log` collection
  → Fields: id, actor_type, actor_id, action, details, timestamp
```

#### 5.5 — Agent API routes (`server/routes/agents.js`)
```
POST   /api/agents/register          → Register agent → generate agent_token → return token
GET    /api/agents                    → List all agents (directory)
GET    /api/agents/:id                → Agent detail + recent activity
PATCH  /api/agents/:id/status        → Admin: set "active" or "paused"
POST   /api/agents/:id/interact      → Send task to agent (with rate limit)
GET    /api/agents/:id/activity      → Activity log for agent
POST   /api/agents/:id/report        → Report agent (reporter_id, reason, timestamp)
```

#### 5.6 — Agent interaction router (`server/services/agentOrchestrator.js`)
Implement the full interaction flow from the V2 spec:
1. Validate agent exists and is active
2. Check idempotency key (`x-idempotency-key` header) → return cached response if exists
3. Rate limit check (10/min, 50/session, 100/day)
4. Call agent endpoint with retries (3 attempts, exponential backoff)
5. On success: log activity, update `last_seen` + `sessions_today`, cache idempotent response (1h TTL)
6. On failure after 3 retries: log error, return `502 { error: "agent_unreachable" }`

#### 5.7 — Agent registration form fields (stored in Firestore `agents` collection)
```
{
  id: auto-generated,
  name: string (required),
  capabilities: string[] (multi-select + free text),
  endpoint: URL (required),
  contact_email: string (optional),
  agent_type: "study-helper" | "founder-advisor" | "wellness" | "moderator" | "custom",
  agent_token: "agnt_" + crypto.randomUUID(),
  status: "active",
  created_at: timestamp,
  last_seen: timestamp,
  sessions_today: 0,
  total_sessions: 0,
  reports: []
}
```

#### 5.8 — Admin/observability API (`server/routes/admin.js`)
```
GET /api/admin/observability    → Metrics: active agent count, sessions today, messages today, errors today
GET /api/admin/activity-log     → Paginated activity log (query: limit, offset, actor_type)
```

#### 5.9 — Frontend: `AgentCard.jsx`
- Display: name, capabilities, status indicator (green dot = active), last seen, sessions today
- Buttons: "Interact" + "Report"

#### 5.10 — Frontend: `Agents.jsx` (directory page)
- Card grid of all registered agents
- Search/filter by capability or type
- "Register Agent" button → link to `/agents/register`

#### 5.11 — Frontend: `AgentRegister.jsx`
- Form: Name, Capabilities (tag input), API Endpoint URL, Contact Email, Agent Type (dropdown)
- On submit: `POST /api/agents/register` → show returned `agent_token` (copy-to-clipboard)
- Validation: name required, endpoint required (valid URL)

#### 5.12 — Frontend: `AgentDetail.jsx`
- Full agent info, capabilities list, status
- Activity log timeline (scrollable)
- "Interact" form: task input + context textarea + submit
- Response display area

#### 5.13 — Frontend: `AgentAdmin.jsx` (observability dashboard)
- Metrics cards: Active agents, Sessions today, Messages today, Errors
- Recent activity feed (real-time or polling)
- Agent list with pause/activate toggle per agent

#### 5.14 — `useAgents.js` hook
- `fetchAgents()`, `registerAgent(data)`, `interactWithAgent(id, task)`, `reportAgent(id, reason)`
- Manages loading, error, and data state

#### Validation checkpoint (HW3 Compliance)
- [ ] 6+ agents can be registered via self-onboarding form
- [ ] Agent directory shows all agents with capabilities, status, last seen
- [ ] Rate limiting works: 10 msg/min per agent → 429 on exceed
- [ ] Moderation: report button logs report, admin can pause/activate agents
- [ ] Observability dashboard shows live metrics + activity log
- [ ] Idempotent API calls: same `x-idempotency-key` returns cached response
- [ ] Retry logic: 3 attempts with exponential backoff
- [ ] Clear error messages: `rate_limit_exceeded`, `agent_not_found`, `agent_paused`, `agent_unreachable`

---

## Phase 6: Map Tab (Campus Presence)

**Goal**: Real-time Google Maps view of MIT campus with presence hotspots.

### Steps

#### 6.1 — Google Maps API setup
- Enable Google Maps JavaScript API in GCP console
- Get API key, restrict to meetMIT domains
- Install `@googlemaps/js-api-loader` in client

#### 6.2 — Map API routes (`server/routes/map.js`)
```
GET  /api/map/hotspots     → Aggregated campus hotspot data
POST /api/map/checkin      → Check in to a location (opt-in)
```

#### 6.3 — WebSocket presence server
Add to `server/index.js`:
- `ws` library, upgrade on `/ws/presence`
- On connect: authenticate JWT from query param
- On message: location update (lat, lng, status)
- Broadcast: aggregated hotspot counts every 30s
- Geofence: reject updates outside MIT campus radius (42.3601°N, 71.0942°W, ~1km)

#### 6.4 — Presence tracking in Redis
```
Key: presence:{locationId}  → SET of user UIDs
TTL: 5 minutes (auto-expire stale presence)
```
Never expose individual locations — only aggregate counts per hotspot.

#### 6.5 — `CampusMap.jsx` component
- Google Maps centered on MIT campus
- Predefined hotspots: Stata Center, Lobby 13, Barker Library, Student Center, etc.
- Hotspot bubbles with count: "12 free now"
- User location (blue pulse pin, opt-in)
- Active MeetMITs: orange pins
- Tap hotspot → card with details + "MeetMIT someone here" button

#### 6.6 — `Map.jsx` page
- Full-screen map with overlay controls
- Toggle: "Share my location" (opt-in)
- `usePresence.js` hook: WebSocket connection, hotspot data, checkin

#### 6.7 — `usePresence.js` hook
- WebSocket connection lifecycle (connect, reconnect, close)
- Hotspot state management
- Location sharing toggle with geolocation API

#### Validation checkpoint
- [ ] Map renders MIT campus with hotspot markers
- [ ] Hotspot counts update via WebSocket
- [ ] Check-in works and updates aggregated count
- [ ] Geofence rejects non-MIT coordinates
- [ ] User location is opt-in only

---

## Phase 7: Trust & Profile Tabs

**Goal**: Reputation system, privacy controls, full profile management.

### Steps

#### 7.1 — Trust API routes (`server/routes/trust.js`)
```
GET  /api/trust/score             → Trust score + badges for current user
POST /api/trust/report            → Report a user (reason, details)
GET  /api/trust/blocked           → List blocked users
POST /api/trust/block/:userId     → Block a user
```

#### 7.2 — Trust score computation (`server/services/trustScoreService.js`)
```
computeTrustScore(userId):
  - Base: 50
  - +5 per completed meet (max +25)
  - +3 per feedback given (max +15)
  - +10 per badge earned
  - -20 per unresolved report against user
  → Cap at 100
```

#### 7.3 — Badge definitions
```
"reliable"       → 5+ meets completed
"mentor"         → 3+ mentor sessions
"founder-friend" → helped 3+ founders
"streak-3"       → 3 consecutive weeks with meets
"founding-member" → first 50 users
```

#### 7.4 — `Trust.jsx` page
- Trust score display (large number + progress ring)
- Badges grid with earned/locked states
- Block/report management list
- Privacy controls: calendar toggle, presence toggle, data export button

#### 7.5 — `Profile.jsx` (You tab)
- Profile card: name, photo, department, year, bio (editable)
- Vibe profile: OCEAN radar chart (editable via "Retake Quiz" button)
- Availability modes: toggle between Casual, Study, Founder, Zen, Offline
- Calendar connection: Google Calendar OAuth toggle (read-only)
- Automation level: Manual ↔ Assist ↔ Autopilot slider
- MeetMIT history: past meets with ratings and notes
- Settings: notifications toggle, theme (dark/light), logout

#### 7.6 — Google Calendar integration (`server/services/calendarSync.js`)
```
POST /api/auth/google/callback  → OAuth callback, store refresh token
GET  /api/profile/calendar      → Fetch free slots from Google Calendar (read-only)
```
- OAuth scope: `https://www.googleapis.com/auth/calendar.readonly`
- Parse events → compute free slots → store in user doc `free_slots` array
- User can revoke anytime

#### Validation checkpoint
- [ ] Trust score computes correctly
- [ ] Badges award based on activity thresholds
- [ ] Block/report creates records, blocked users excluded from matches
- [ ] Profile editable, OCEAN retake works
- [ ] Calendar connection fetches real free slots (or mock for dev)

---

## Phase 8: Public API, Insights, Polish & Deploy

**Goal**: Developer API, analytics, error handling, final deployment.

### Steps

#### 8.1 — Public API v1 (`server/routes/publicApi.js`)
```
GET  /api/v1/directory           → Public agent directory (no auth required)
GET  /api/v1/offers              → Public offers feed (no auth required)
POST /api/v1/agents/:id/task     → Send task to agent (API key auth)
```
API key auth: header `X-API-Key` validated against stored keys.

#### 8.2 — Insights API (`server/routes/insights.js`)
```
GET /api/insights/personal    → Your stats: meets count, top matches, trends over time
GET /api/insights/community   → Community stats: popular times, top spots, active users
```

#### 8.3 — Error handler middleware (`server/middleware/errorHandler.js`)
- Catch-all error handler
- Structured error responses: `{ error: string, message: string, status: number }`
- Log errors to Cloud Logging

#### 8.4 — CORS configuration
- Whitelist: `meetmit-api-114661584115.us-east1.run.app`, `localhost:5173`

#### 8.5 — Input sanitization
- Sanitize all user-facing text fields (name, bio, offer text, report details)
- Prevent XSS in stored content

#### 8.6 — Environment variables (`.env.production`)
```
NODE_ENV=production
PORT=8080
FIREBASE_PROJECT_ID=meetmit-prod
FIREBASE_API_KEY=AIza...
FIREBASE_AUTH_DOMAIN=meetmit-prod.firebaseapp.com
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
GOOGLE_REDIRECT_URI=https://meetmit-api-xxx.run.app/api/auth/google/callback
REDIS_URL=redis://10.x.x.x:6379
ANTHROPIC_API_KEY=sk-ant-xxxx
AGENT_RATE_LIMIT_PER_MIN=10
AGENT_RATE_LIMIT_PER_SESSION=50
USER_RATE_LIMIT_PER_MIN=30
```

#### 8.7 — GCP infrastructure provisioning
```bash
# Firestore
gcloud firestore databases create --location=us-east1

# Redis (Memorystore)
gcloud redis instances create meetmit-cache \
  --size=1 --region=us-east1 --redis-version=redis_7_0

# Cloud CDN bucket (optional, for static assets)
gsutil mb -l us-east1 gs://meetmit-frontend-assets
```

#### 8.8 — Deploy to Cloud Run
```bash
# Build and deploy
gcloud run deploy meetmit-api \
  --source . \
  --region us-east1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,FIREBASE_PROJECT_ID=meetmit-prod" \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10
```

#### 8.9 — Seed data
- Register 6+ sample agents via the registration form or API
- Create sample offers
- Create sample user profiles with OCEAN scores
- Verify all flows end-to-end

#### Validation checkpoint (FINAL)
- [ ] All 6 tabs functional
- [ ] Auth flow: magic link → onboarding → home
- [ ] Sparks: matches load with affinity scores, accept/reshuffle works
- [ ] Map: renders campus, hotspots show counts
- [ ] Offers: CRUD works, categories/sorting work
- [ ] Agents: 6+ registered, directory, interact, rate limit (429), moderation, observability
- [ ] Trust: score computes, badges award, block/report works
- [ ] Profile: editable, OCEAN retake, calendar connect
- [ ] Public API: directory + offers accessible, agent tasks via API key
- [ ] Error handling: structured responses, rate limits enforced
- [ ] Deployed to Cloud Run and accessible

---

## Execution File Map

Below is the **complete list of files to create**, organized by phase. Each file is listed once.

### Phase 0 — Scaffold (9 files)
```
client/package.json
client/vite.config.js
client/index.html
server/package.json
server/index.js
shared/meetTypes.js
shared/oceanTraits.js
shared/errorCodes.js
Dockerfile
```

### Phase 1 — Design System (10 files)
```
client/tailwind.config.js
client/postcss.config.js
client/src/styles/globals.css
client/src/main.jsx
client/src/App.jsx
client/src/components/NavTabs.jsx
client/src/components/Card.jsx
client/src/components/Button.jsx
client/src/components/Chip.jsx
client/src/components/Toast.jsx
```

### Phase 2 — Auth & Onboarding (8 files)
```
server/config/firebase.js
server/config/env.js
server/routes/auth.js
server/routes/profile.js
server/middleware/authMiddleware.js
client/src/utils/firebase.js
client/src/hooks/useAuth.js
client/src/pages/Onboarding.jsx
```

### Phase 3 — Sparks (8 files)
```
server/services/affinityEngine.js
server/services/matchmaker.js
server/routes/sparks.js
server/routes/sessions.js
client/src/components/SparkCard.jsx
client/src/components/VibeRadar.jsx
client/src/pages/Sparks.jsx
client/src/hooks/useSparks.js
```

### Phase 4 — Offers (4 files)
```
server/routes/offers.js
client/src/components/OfferCard.jsx
client/src/pages/Offers.jsx
client/src/hooks/useOffers.js
```

### Phase 5 — Agents / HW3 (13 files)
```
server/config/redis.js
server/middleware/rateLimiter.js
server/middleware/agentAuth.js
server/services/activityLogger.js
server/services/agentOrchestrator.js
server/routes/agents.js
server/routes/admin.js
client/src/components/AgentCard.jsx
client/src/pages/Agents.jsx
client/src/pages/AgentRegister.jsx
client/src/pages/AgentDetail.jsx
client/src/pages/AgentAdmin.jsx
client/src/hooks/useAgents.js
```

### Phase 6 — Map (4 files)
```
server/routes/map.js
client/src/components/CampusMap.jsx
client/src/pages/Map.jsx
client/src/hooks/usePresence.js
```

### Phase 7 — Trust & Profile (5 files)
```
server/routes/trust.js
server/services/trustScoreService.js
server/services/calendarSync.js
client/src/pages/Trust.jsx
client/src/pages/Profile.jsx
```

### Phase 8 — API, Insights, Deploy (6 files)
```
server/routes/publicApi.js
server/routes/insights.js
server/middleware/errorHandler.js
client/src/utils/api.js
.env.production
.env.development
```

**Total: 67 files** (34 server, 29 client, 3 shared, 1 Dockerfile)

---

## Dependency Summary

### Client (`client/package.json`)
```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "react-router-dom": "^6",
    "framer-motion": "^11",
    "@googlemaps/js-api-loader": "^1",
    "firebase": "^10"
  },
  "devDependencies": {
    "vite": "^5",
    "@vitejs/plugin-react": "^4",
    "tailwindcss": "^3",
    "postcss": "^8",
    "autoprefixer": "^10"
  }
}
```

### Server (`server/package.json`)
```json
{
  "dependencies": {
    "express": "^4",
    "cors": "^2",
    "helmet": "^7",
    "firebase-admin": "^12",
    "ioredis": "^5",
    "axios": "^1",
    "uuid": "^9",
    "jsonwebtoken": "^9",
    "ws": "^8"
  },
  "devDependencies": {
    "nodemon": "^3"
  }
}
```

---

## Critical Path & Priorities

```
Phase 0 (Scaffold)  ─┐
Phase 1 (Design)     ├──→ Phase 2 (Auth) ──→ Phase 3 (Sparks)
                     │                        ↓
                     │              Phase 4 (Offers) ──┐
                     │                                  ├──→ Phase 8 (Deploy)
                     └──→ Phase 5 (Agents/HW3) ───────┘
                          Phase 6 (Map) ──────────────┘
                          Phase 7 (Trust/Profile) ────┘
```

**Phases 5 (Agents) and 3 (Sparks) are the highest priority** — they represent the core HW3 requirements and the product's key differentiator respectively.

Phases 4, 6, 7 can be parallelized after Phase 2 (Auth) is done, as they all depend on auth but not on each other.

---

## Notes for Execution

1. **Don't delete V1 yet** — keep it as reference. Build V2 in the same repo under `client/` and `server/` directories alongside existing files.

2. **Dev workflow**: Run `cd client && npm run dev` (port 5173) and `cd server && npx nodemon index.js` (port 8080) simultaneously. Vite proxies `/api` calls to the server.

3. **Firestore emulator**: Use `firebase emulators:start` for local development instead of hitting production Firestore.

4. **Redis local**: Run `docker run -p 6379:6379 redis:7-alpine` for local Redis.

5. **Test each phase independently** before moving on. Each phase has a validation checkpoint — don't skip them.

6. **Token efficiency**: The shared constants in `shared/` prevent duplication between client and server. Reuse `affinityEngine.js` logic from V1's `lib/affinity.ts`.

7. **The Dockerfile serves both client and server** — Vite builds static files, Express serves them alongside the API. One Cloud Run service, one deploy.
