# meetMIT V2 — Full Architecture & Redesign Spec

> **Cursor-ready deployment spec** · Google Cloud · March 2026
> **Live V1**: `https://meetmit-api-114661584115.us-east1.run.app/sparks`

---

## 0. Executive Summary

meetMIT V2 transforms from a basic spark-matching prototype into **MIT's definitive social capital engine** — the place where every meaningful connection on campus begins. Drawing from the explosive growth patterns of Fizz (campus-first, anonymous trust), Bumble BFF (platonic matching + groups), Lunchclub (AI-powered 1:1 curation), and Jagat (location-based social maps), V2 combines **agentic AI matching**, **real-time campus presence**, **value-for-value exchange**, and a **developer API** into one MIT-only platform.

The goal: **500 active users in 8 weeks**, scaling to the entire MIT community (11,000+) within one semester, with a self-sustaining value exchange model that makes leaving feel like losing your unfair advantage.

---

## 1. Current State Analysis (V1)

### What Exists
- **5 tabs**: Sparks, Offers, Insights, Trust, Settings
- **Sparks page**: Card-based matching with filter chips (Tonight, Study, Founder, Low-energy, Group-only)
- **Tech stack**: Google Cloud Run, static HTML frontend, API backend
- **Status**: Loading states visible, minimal interactivity, no live data flow

### Critical Gaps
- No MIT email authentication (`.edu` gate missing)
- No personality/affinity engine (OCEAN quiz not implemented)
- No calendar integration
- No real-time presence or location awareness
- No agent registration system (HW3 requirement)
- No post-meet feedback loop
- No value exchange mechanism
- No observability or moderation tools
- No API for third-party developers

---

## 2. Competitive Intelligence & Growth Lessons

### What Won (and why meetMIT should absorb it)

| Platform | Key Insight | meetMIT Application |
|----------|------------|---------------------|
| **Fizz** | Campus-only anonymity + marketplace = trust + utility. 500K+ listings in 2025. | MIT-only `.edu` gate + value exchange board. Trust through exclusivity, not anonymity. |
| **Bumble BFF** | 1:1 swipe fatigue → group-first communities. 47% of young adults want activity-based friend groups. | Group MeetMITs (3-5 people), activity-based matching, not just 1:1. |
| **Jagat** | Location-based social map with AR + real-time presence. Fastest-growing social map app 2025. | MIT Campus Map with live "who's free where" pins. Stata, Lobby 13, libraries as social hotspots. |
| **Lunchclub** | AI-curated 1:1 professional intros with calendar sync. | Affinity engine + calendar scan = "magic matches" with context. |
| **Timeleft / 222** | Stranger dinner matching → IRL-first, time-boxed, low-commitment. | 30-90 min time-boxed MeetMITs. Low friction, high signal. |
| **Moltbook** | Agent-only social network (2026 viral moment). Agentic AI is culturally hot. | Agents tab for HW3. Agents as campus helpers, not replacement for humans. |
| **Gigi.co** | Network-as-a-graph, warm intros, shareable lists. | Shareable MeetMIT links, network graph visualization, intro drafting. |

### 2026 Macro Trends to Ride

1. **Agentic AI is mainstream**: $236B market by 2034 (45% CAGR). Students expect AI that acts, not just chats.
2. **Loneliness epidemic on campus**: 47% of young adults want more friends. Post-pandemic connection hunger persists.
3. **IRL-first renaissance**: BeReal, Timeleft, Bumble BFF relaunch all bet on real-life over feeds.
4. **Community > Content**: Shift from broadcasting to belonging. Private groups, local events, shared activities.
5. **Campus-exclusive trust**: Fizz and Yik Yak prove geofenced, verified communities grow faster than open ones.

---

## 3. Architecture Overview

### 3.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React SPA)                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│  │Sparks│ │ Map  │ │Offers│ │Agents│ │Trust │ │ You  │        │
│  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘        │
│     └────────┴────────┴────────┴────────┴────────┘              │
│                            │                                      │
│              React + Tailwind + Framer Motion                     │
│              Google Maps SDK · WebSocket client                   │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / WSS
┌────────────────────────────┴────────────────────────────────────┐
│                    API GATEWAY (Cloud Run)                        │
│         Express.js / Fastify · JWT Auth · Rate Limiter           │
│         ┌─────────────┐  ┌──────────────┐  ┌─────────────┐     │
│         │ Auth Service │  │ Match Engine  │  │ Agent Router │     │
│         │ (MIT .edu)   │  │ (OCEAN+Cal)  │  │ (HW3)       │     │
│         └──────┬──────┘  └──────┬───────┘  └──────┬──────┘     │
│                └────────────────┴──────────────────┘              │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                      DATA LAYER                                   │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐     │
│   │  Firestore   │  │  Cloud SQL   │  │  Redis (Memorystore)│   │
│   │  (profiles,  │  │  (analytics, │  │  (sessions, rate   │   │
│   │   matches,   │  │   logs,      │  │   limits, presence)│   │
│   │   agents)    │  │   metrics)   │  │                    │   │
│   └──────────────┘  └──────────────┘  └──────────────────┘     │
│                                                                   │
│   ┌──────────────┐  ┌──────────────┐                             │
│   │ Cloud Tasks  │  │ Pub/Sub      │                             │
│   │ (async jobs) │  │ (events)     │                             │
│   └──────────────┘  └──────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React 18 + Vite + Tailwind CSS | Fast builds, utility-first styling, component reuse |
| **Animations** | Framer Motion | Smooth card transitions, presence animations |
| **Maps** | Google Maps JavaScript API | MIT campus pins, live presence, route suggestions |
| **Backend** | Node.js + Express on Cloud Run | Already deployed on GCP, serverless scaling |
| **Auth** | Firebase Auth (email link) | MIT `.edu` verification, no password friction |
| **Database** | Firestore | Real-time sync, flexible schema, GCP-native |
| **Cache/Sessions** | Redis (Memorystore) | Rate limiting, presence tracking, session store |
| **Queue** | Cloud Tasks + Pub/Sub | Async matching, notification dispatch, agent tasks |
| **Calendar** | Google Calendar API (read-only) | Free-slot detection, opt-in |
| **AI/Matching** | Anthropic Claude API (Sonnet) | Affinity scoring, invite drafting, agent intelligence |
| **Hosting** | Cloud Run + Cloud CDN | Auto-scaling, HTTPS, global edge cache |
| **Monitoring** | Cloud Logging + Cloud Trace | Observability, error tracking |

---

## 4. Frontend Architecture — 6 Core Tabs

### 4.1 Tab: **Sparks** (Home — The Magic Match Feed)

This is the heart of meetMIT. A vertical card stack showing AI-curated matches.

**Card Anatomy:**
```
┌─────────────────────────────────────┐
│  [Avatar]  Maya S. · Sloan MBA '26  │
│  ─────────────────────────────────  │
│  87% Vibe Match                      │
│  ██████████████░░░ (High-O, High-C) │
│                                      │
│  "GTM feedback + pitch deck review"  │
│  📍 Lobby 13 · 🕖 7:00 PM tonight   │
│                                      │
│  [♻️ Reshuffle]     [⚡ MeetMIT]     │
└─────────────────────────────────────┘
```

**Filter Chips** (top rail, horizontally scrollable):
- `All` · `Tonight` · `Study` · `Coffee` · `Founder` · `Mentor` · `Walk` · `Group` · `Low-energy` · `Lab-buddy`

**Interactions:**
- Swipe right → Accept match → Calendar invite + location pin
- Swipe left → Reshuffle → New match animates in
- Tap card → Expand detail view (full OCEAN breakdown, mutual interests, suggested topics)
- FAB button (+) → "Post a MeetMIT Request" (value-for-value board)

**Data Flow:**
1. Client calls `GET /api/sparks?filter=tonight&limit=10`
2. Backend runs affinity engine: OCEAN similarity (70% weight) + calendar overlap (20%) + historical feedback (10%)
3. Returns ranked matches with compatibility scores
4. Client renders card stack with Framer Motion stagger animation

### 4.2 Tab: **Map** (MIT Campus Presence — NEW)

A real-time Google Maps view of MIT campus showing:
- **Hotspot bubbles**: Stata Center (12 free now), Lobby 13 (5 free), Barker Library (8 free)
- **Your location** (opt-in): Blue pulse pin
- **Active MeetMITs**: Orange pins showing confirmed meetings in progress
- **Suggested spots**: AI-recommended locations based on meet type (quiet for study, buzzy for founder)

**Hotspot Card (on tap):**
```
┌───────────────────────────────┐
│  📍 Stata Center, 32-G882    │
│  12 MIT-ers free right now    │
│  Top vibes: Study, Lab-buddy │
│  [⚡ MeetMIT someone here]   │
└───────────────────────────────┘
```

**Data Flow:**
- Presence updates via WebSocket every 30s (opt-in)
- Aggregated counts, never individual tracking without consent
- Geofenced to MIT campus (42.3601° N, 71.0942° W, ~1km radius)

### 4.3 Tab: **Offers** (Value Exchange Board)

The marketplace where MIT students post what they want and what they give in return.

**Post Structure:**
```
┌─────────────────────────────────────┐
│  🔥 WANT: GTM feedback for robotics │
│     startup (15-min pitch review)    │
│                                      │
│  💎 OFFER: I'll buy coffee +         │
│     30-min system design critique    │
│                                      │
│  Posted by: Leo K. · CSAIL MEng     │
│  ⏰ Available: Tonight 7-9 PM        │
│  📍 Preferred: Stata 3rd floor       │
│                                      │
│  [🤝 Accept Offer]  [💬 Message]    │
└─────────────────────────────────────┘
```

**Categories:** Study Help · Founder Feedback · Mentorship · Code Review · Design Critique · Career Advice · Pizza Deal · Coffee Chat · Meditation · Fitness Buddy

**Sorting:** Newest · Expiring Soon · Highest Vibe Match · Most Popular

### 4.4 Tab: **Agents** (HW3 Agentic Layer)

Dedicated tab for AI agent registration and interaction, fully compliant with HW3.

**Sub-views:**
- **Agent Directory** (`/agents`): Card grid of all registered agents
- **Register Agent** (`/agents/register`): Self-onboarding form
- **Agent Detail** (`/agents/:id`): Activity log, capabilities, interaction history
- **Admin Panel** (`/agents/admin`): Moderation, pause/disable, observability metrics

**Agent Card:**
```
┌─────────────────────────────────────┐
│  🤖 StudyBot-6036                    │
│  Capabilities: 6.036, 6.006, p-set  │
│     explainers, study planning       │
│                                      │
│  Status: ● Active                    │
│  Last seen: 5 minutes ago            │
│  Sessions today: 12                  │
│                                      │
│  [💬 Interact]  [⚠️ Report]         │
└─────────────────────────────────────┘
```

**Agent Registration Form Fields:**
- Agent Name (text, required)
- Capabilities (multi-select tags + free text)
- API Endpoint URL (text, required)
- Contact Email (optional)
- Agent Type: `study-helper` | `founder-advisor` | `wellness` | `moderator` | `custom`

**On Submit:**
- Stored in `agents` Firestore collection
- Returns `agent_token` for authenticated API calls
- Agent appears in directory immediately

**Rate Limiting (per agent):**
- 10 messages/minute max
- 50 messages/session max
- 100 sessions/day max
- Exceeded → `429 { "error": "rate_limit_exceeded" }`

**Moderation:**
- Report button on every agent card → logs `{ reporter_id, agent_id, reason, timestamp }`
- Admin can `PATCH /api/agents/:id/status` → `"paused"` or `"active"`
- Paused agents blocked from receiving new tasks

**Observability Dashboard** (`/agents/admin`):
```
┌─────────────────────────────────────────────┐
│  📊 Agent Observability                      │
│                                              │
│  Active agents: 8    Sessions today: 47      │
│  Messages today: 312  Errors: 3              │
│                                              │
│  Recent Activity:                            │
│  20:15  StudyBot-6036 helped 6.036 session   │
│  20:10  GTM-Advisor joined meetMIT           │
│  20:05  Vibe-Matcher matched 3 pairs         │
│  19:58  WellnessBot suggested meditation     │
└─────────────────────────────────────────────┘
```

### 4.5 Tab: **Trust** (Reputation & Safety)

- **Your Trust Score**: Composite of meets completed, feedback given, reports (0 = clean)
- **Badges**: "Reliable" (5+ meets), "Mentor" (3+ mentor sessions), "Founder Friend" (helped 3+ founders)
- **Block/Report**: Manage blocked users, view report history
- **Privacy Controls**: Calendar access toggle, presence sharing toggle, data export

### 4.6 Tab: **You** (Profile & Vibe Settings)

- **Profile Card**: Name, photo, department, year, short bio
- **Vibe Profile**: OCEAN radar chart (editable by retaking quiz)
- **Availability Modes**: Toggle between Casual, Study, Founder, Zen, Offline
- **Calendar Connection**: Google Calendar OAuth (read-only) toggle
- **Automation Level**: Manual → Assist → Autopilot slider
- **MeetMIT History**: Past meets with ratings and notes
- **Settings**: Notifications, theme (dark/light), logout

---

## 5. Backend Architecture

### 5.1 API Routes

```
AUTH
  POST   /api/auth/verify-mit       → Send magic link to MIT email
  POST   /api/auth/confirm           → Confirm magic link, issue JWT
  POST   /api/auth/refresh           → Refresh JWT
  DELETE /api/auth/logout             → Invalidate session

PROFILE
  GET    /api/profile                 → Get current user profile
  PUT    /api/profile                 → Update profile
  POST   /api/profile/vibe-check     → Submit OCEAN quiz answers → compute affinity
  GET    /api/profile/vibe            → Get OCEAN scores + radar data

SPARKS (Matching)
  GET    /api/sparks                  → Get ranked matches (filters: type, time, energy)
  POST   /api/sparks/:matchId/accept → Accept a match → create MeetMIT session
  POST   /api/sparks/:matchId/reshuffle → Skip, get new match
  GET    /api/sparks/history          → Past matches and outcomes

MEETMIT SESSIONS
  GET    /api/sessions                → Active and upcoming sessions
  GET    /api/sessions/:id            → Session detail (participants, location, time)
  POST   /api/sessions/:id/feedback  → Post-meet rating + notes
  DELETE /api/sessions/:id            → Cancel a session

OFFERS (Value Exchange)
  GET    /api/offers                  → List all offers (filters: category, time, campus area)
  POST   /api/offers                  → Create an offer
  PUT    /api/offers/:id              → Edit offer
  DELETE /api/offers/:id              → Remove offer
  POST   /api/offers/:id/accept      → Accept an offer → create session

MAP (Presence)
  GET    /api/map/hotspots            → Aggregated campus hotspot data
  WS     /ws/presence                 → WebSocket for real-time presence updates
  POST   /api/map/checkin             → Check in to a location (opt-in)

AGENTS (HW3)
  POST   /api/agents/register         → Register new agent → return agent_token
  GET    /api/agents                   → List all agents (directory)
  GET    /api/agents/:id               → Agent detail + activity log
  PATCH  /api/agents/:id/status       → Admin: pause/activate agent
  POST   /api/agents/:id/interact     → Send task to agent
  GET    /api/agents/:id/activity     → Agent activity log
  POST   /api/agents/:id/report       → Report an agent

AGENTS OBSERVABILITY
  GET    /api/admin/observability      → Metrics: active agents, sessions, errors
  GET    /api/admin/activity-log       → Recent system events

TRUST
  GET    /api/trust/score              → Current user's trust score + badges
  POST   /api/trust/report             → Report a user
  GET    /api/trust/blocked            → List blocked users
  POST   /api/trust/block/:userId     → Block a user

INSIGHTS (Analytics)
  GET    /api/insights/personal        → Your stats: meets, top matches, trends
  GET    /api/insights/community       → Community stats: popular times, top spots

PUBLIC API (v1 — for developers)
  GET    /api/v1/directory              → Public agent directory
  GET    /api/v1/offers                 → Public offers feed
  POST   /api/v1/agents/:id/task       → Send task to agent (API key auth)
```

### 5.2 Data Models (Firestore)

**`users` collection:**
```json
{
  "uid": "firebase-uid",
  "email": "student@mit.edu",
  "name": "Maya S.",
  "photo_url": "https://...",
  "department": "Sloan MBA",
  "year": 2026,
  "bio": "AI-first B2B SaaS founder. GTM obsessed.",
  "ocean": {
    "openness": 4.2,
    "conscientiousness": 4.5,
    "extraversion": 3.8,
    "agreeableness": 3.5,
    "neuroticism": 1.8
  },
  "availability_mode": "founder",
  "automation_level": "assist",
  "calendar_connected": true,
  "free_slots": [
    { "start": "2026-03-04T19:00:00Z", "end": "2026-03-04T21:00:00Z" }
  ],
  "trust_score": 92,
  "badges": ["reliable", "founder-friend"],
  "meets_completed": 14,
  "created_at": "2026-02-01T...",
  "last_active": "2026-03-04T18:30:00Z",
  "is_active": true,
  "blocked_users": []
}
```

**`matches` collection:**
```json
{
  "id": "match-uuid",
  "user_a": "uid-1",
  "user_b": "uid-2",
  "affinity_score": 0.87,
  "match_type": "founder",
  "suggested_location": "Lobby 13",
  "suggested_time": "2026-03-04T19:00:00Z",
  "status": "pending | accepted | completed | cancelled",
  "feedback_a": { "rating": 5, "notes": "Great GTM insights" },
  "feedback_b": { "rating": 4, "notes": "Would meet again" },
  "created_at": "2026-03-04T17:00:00Z"
}
```

**`offers` collection:**
```json
{
  "id": "offer-uuid",
  "author_uid": "uid-1",
  "want": "GTM feedback for robotics startup",
  "offer": "Coffee + 30-min system design critique",
  "category": "founder",
  "location_pref": "Stata Center",
  "available_window": {
    "start": "2026-03-04T19:00:00Z",
    "end": "2026-03-04T21:00:00Z"
  },
  "status": "open | claimed | completed | expired",
  "claimed_by": null,
  "created_at": "2026-03-04T16:00:00Z"
}
```

**`agents` collection:**
```json
{
  "id": "agent-uuid",
  "name": "StudyBot-6036",
  "capabilities": ["6.036", "6.006", "study-planning", "p-set-help"],
  "endpoint": "https://claw-bot-study.example.com/api",
  "contact_email": "student@mit.edu",
  "agent_type": "study-helper",
  "agent_token": "agnt_xxxxxxxxxxxxx",
  "status": "active | paused",
  "created_at": "2026-03-04T10:00:00Z",
  "last_seen": "2026-03-04T20:15:00Z",
  "sessions_today": 12,
  "total_sessions": 45,
  "reports": []
}
```

**`activity_log` collection:**
```json
{
  "id": "log-uuid",
  "actor_type": "agent | user | system",
  "actor_id": "agent-uuid or uid",
  "action": "helped_study | matched_pair | registered | reported | error",
  "details": "StudyBot-6036 helped 6.036 session with user uid-3",
  "timestamp": "2026-03-04T20:15:00Z"
}
```

### 5.3 Affinity Engine (Core Matching Algorithm)

```javascript
// affinity.js — OCEAN-based matching

function computeAffinity(userA, userB) {
  const traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness'];
  
  // 1. Trait similarity (0-1 scale)
  let similarity = 0;
  traits.forEach(trait => {
    const diff = Math.abs(userA.ocean[trait] - userB.ocean[trait]);
    similarity += (1 - diff / 4); // max diff is 4 (5-1)
  });
  similarity /= traits.length;
  
  // 2. Neuroticism penalty (both low = better)
  const stabilityBonus = (
    (5 - userA.ocean.neuroticism) / 4 + 
    (5 - userB.ocean.neuroticism) / 4
  ) / 2 * 0.1;
  
  // 3. Strategic complements bonus
  let complementBonus = 0;
  // High-E + High-A = great for coffee/founder meets
  if (userA.ocean.extraversion > 3.5 && userB.ocean.agreeableness > 3.5) {
    complementBonus += 0.05;
  }
  // High-C + High-C = great for study accountability
  if (userA.ocean.conscientiousness > 3.5 && userB.ocean.conscientiousness > 3.5) {
    complementBonus += 0.05;
  }
  
  // 4. Calendar overlap score
  const calendarOverlap = computeCalendarOverlap(userA.free_slots, userB.free_slots);
  
  // 5. Historical feedback boost
  const feedbackBoost = getHistoricalFeedback(userA.uid, userB.uid);
  
  // Weighted final score
  const score = (
    similarity * 0.55 +
    stabilityBonus +
    complementBonus +
    calendarOverlap * 0.20 +
    feedbackBoost * 0.10
  );
  
  return Math.min(Math.round(score * 100), 99); // cap at 99%
}
```

### 5.4 Rate Limiting Middleware

```javascript
// rateLimit.js
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

async function agentRateLimit(req, res, next) {
  const agentId = req.agent?.id;
  if (!agentId) return next();
  
  const key = `rate:agent:${agentId}:${Math.floor(Date.now() / 60000)}`;
  const count = await redis.incr(key);
  
  if (count === 1) await redis.expire(key, 60);
  
  if (count > 10) {
    await logActivity('system', agentId, 'rate_limit_exceeded', `Agent ${agentId} exceeded 10 msg/min`);
    return res.status(429).json({ error: 'rate_limit_exceeded', retry_after: 60 });
  }
  
  next();
}

async function userRateLimit(req, res, next) {
  const uid = req.user?.uid;
  if (!uid) return next();
  
  const key = `rate:user:${uid}:${Math.floor(Date.now() / 60000)}`;
  const count = await redis.incr(key);
  
  if (count === 1) await redis.expire(key, 60);
  if (count > 30) {
    return res.status(429).json({ error: 'rate_limit_exceeded' });
  }
  
  next();
}

module.exports = { agentRateLimit, userRateLimit };
```

### 5.5 Agent Interaction Router

```javascript
// agentRouter.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

// POST /api/agents/:id/interact
router.post('/:id/interact', agentRateLimit, async (req, res) => {
  const agent = await db.collection('agents').doc(req.params.id).get();
  
  if (!agent.exists) return res.status(404).json({ error: 'agent_not_found' });
  if (agent.data().status === 'paused') return res.status(403).json({ error: 'agent_paused' });
  
  const { task, context } = req.body;
  const idempotencyKey = req.headers['x-idempotency-key'];
  
  // Check idempotency
  if (idempotencyKey) {
    const existing = await redis.get(`idem:${idempotencyKey}`);
    if (existing) return res.status(200).json(JSON.parse(existing));
  }
  
  // Call agent endpoint with retries
  let response;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      response = await axios.post(agent.data().endpoint, {
        task, context, meetmit_user: req.user.uid
      }, {
        headers: { 'Authorization': `Bearer ${agent.data().agent_token}` },
        timeout: 10000
      });
      break;
    } catch (err) {
      if (attempt === 2) {
        await logActivity('system', req.params.id, 'error', `Agent unreachable after 3 retries`);
        return res.status(502).json({ error: 'agent_unreachable', message: 'Agent did not respond after 3 attempts' });
      }
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); // Backoff
    }
  }
  
  // Log activity
  await logActivity('agent', req.params.id, 'task_completed', `Handled: ${task}`);
  
  // Update last_seen
  await db.collection('agents').doc(req.params.id).update({
    last_seen: new Date(),
    sessions_today: admin.firestore.FieldValue.increment(1)
  });
  
  // Cache idempotent response
  if (idempotencyKey) {
    await redis.setex(`idem:${idempotencyKey}`, 3600, JSON.stringify(response.data));
  }
  
  res.json(response.data);
});
```

---

## 6. Onboarding Flow (2-Minute, Zero Friction)

```
Step 1: LANDING
  "You came to MIT to meet extraordinary people. Let's MeetMIT."
  [Sign in with MIT email →]

Step 2: VERIFY
  Magic link sent to @mit.edu
  "Check your MIT inbox. One tap to verify."
  (Harvard cross-reg: @college.harvard.edu allowed for MIT events only)

Step 3: QUICK PROFILE
  - Name (pre-filled from email if possible)
  - Photo upload (or skip)
  - Department dropdown
  - Year dropdown
  - Short bio (optional, 140 chars)

Step 4: VIBE CHECK (10 questions, swipe-style)
  Each question: statement + 5-point slider (Strongly Disagree → Strongly Agree)
  Questions animate in one-by-one, progress bar at top.
  
  1. "I love exploring wild, out-there ideas." (O)
  2. "New experiences excite me more than routine." (O)
  3. "I get energy from hanging out with people." (E)
  4. "Big groups or events sound fun to me." (E)
  5. "I always follow through on plans and deadlines." (C)
  6. "Staying organized helps me crush goals." (C)
  7. "I prioritize others' feelings in decisions." (A)
  8. "Helping teammates succeed makes me happy." (A)
  9. "I stay chill under pressure." (low N)
  10. "Drama or conflict stresses me out." (low N — reverse scored)

  → Auto-computes OCEAN profile → Shows radar chart:
  "Your Vibe: High Openness, High Conscientiousness, Med Extraversion"

Step 5: SET YOUR MODE
  "How do you want to MeetMIT?"
  Radio chips: Casual · Study · Founder · Zen · All
  
  "How much help do you want?"
  Slider: Manual ←→ Assist ←→ Autopilot
  
  "Connect your calendar?" (optional)
  [Connect Google Calendar] or [Skip — I'll set times manually]

Step 6: DONE
  "Welcome to meetMIT. Let's find your first spark."
  → Redirect to Sparks tab with first 3 matches ready
```

---

## 7. Visual Design System

### Color Palette
```css
:root {
  /* Core */
  --midnight:     #0D1117;   /* Primary background (dark mode) */
  --surface:      #161B22;   /* Cards, panels */
  --surface-2:    #21262D;   /* Elevated surfaces */
  --border:       #30363D;   /* Subtle borders */
  
  /* MIT Identity */
  --mit-red:      #A31F34;   /* Accent, CTAs, energy */
  --mit-red-glow: #E8364F;   /* Hover states, active */
  --mit-gray:     #8A8B8C;   /* Secondary text */
  
  /* Signal Colors */
  --spark-gold:   #F0B429;   /* Match scores, highlights */
  --trust-green:  #2EA043;   /* Active, verified, safe */
  --alert-orange: #D29922;   /* Warnings, expiring */
  
  /* Text */
  --text-primary: #E6EDF3;   /* Main text */
  --text-muted:   #7D8590;   /* Secondary text */
  --text-link:    #58A6FF;   /* Links */
}
```

### Typography
```css
/* Display: Bold, MIT-technical, heroic */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;600&family=DM+Sans:wght@400;500;600&display=swap');

/* ACTUALLY — per design skill, avoid Space Grotesk. Use instead: */
@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Syne:wght@600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');

:root {
  --font-display: 'Syne', sans-serif;          /* Hero headlines */
  --font-body: 'Instrument Sans', sans-serif;    /* Body text */
  --font-mono: 'IBM Plex Mono', monospace;       /* Code, scores, stats */
}
```

### Component Patterns
- **Cards**: `surface` bg, 1px `border`, 12px radius, subtle shadow, hover → lift + glow
- **Buttons**: `mit-red` primary, ghost secondary, 8px radius, 600 weight
- **Match Score**: `spark-gold` circular progress ring with percentage inside (mono font)
- **Chips/Tags**: Pill-shaped, ghost on `surface-2`, active → filled `mit-red`
- **Avatars**: 48px circle, 2px `trust-green` ring if verified
- **Toast notifications**: Slide-in from bottom, `surface-2` bg, auto-dismiss 4s

---

## 8. Growth Engine: 0 → 500 Users in 8 Weeks

### Week 1-2: Seed (0 → 50)
- **Personal invites**: Founders send to 50 friends/classmates at MIT
- **MIT email drip**: "You came to MIT to meet people. 50 are already here."
- **Scarcity**: "First 50 users get Founding Member badge (permanent)"
- **HW3 class**: 6+ agent registrations from classmates (organic)

### Week 3-4: Spark (50 → 150)
- **"Invite 3, unlock Map"**: Gate the Map tab behind referral (viral loop)
- **MIT mailing lists**: Post to dorm lists, club lists, department lists
- **Value exchange hook**: "Post an Offer. Get help with p-sets. Buy coffee."
- **First community MeetMIT**: Organized group dinner at Stata (Timeleft-style)

### Week 5-6: Ignite (150 → 300)
- **Social proof**: "300 MIT-ers are already MeetMIT-ing. Are you?"
- **Department leaderboards**: "Course 6 has 80 members. Course 15 has 45. Who's winning?"
- **Partner with MIT clubs**: Sloan TechClub, HackMIT, MIT Entrepreneurship Club
- **SMB pilot**: Local café offers "MeetMIT 10% discount" to first 100 users

### Week 7-8: Fly (300 → 500+)
- **API launch**: Developers build integrations (Slack bot, calendar widget)
- **Agent showcase**: "Best agent of the week" featured on homepage
- **Press/blog**: MIT Admissions blog, The Tech (MIT newspaper)
- **Organic network effects**: At 500, every MIT-er knows someone on meetMIT

### Retention Mechanics
- **Weekly Spark Digest**: Email/push: "3 new matches this week. Your top vibe: Leo K. (91%)"
- **Streak counter**: "You've MeetMIT'd 3 weeks in a row" badge
- **Post-meet nudge**: "Maya rated you 5⭐. Meet again next Tuesday?"
- **Seasonal themes**: "Finals Study Sprint", "IAP Founder Blitz", "Spring Walk Series"

---

## 9. Monetization Roadmap

### Phase 1: Free (0-500 users)
- All features free. Focus on growth and retention.

### Phase 2: Value Exchange (500+ users)
- **SMB offers**: Local businesses (cafés, gyms, co-working) sponsor perks for meetMIT users
- **"Sponsored MeetMITs"**: e.g., "MeetMIT at Tatte — first coffee on us" (sponsored by Tatte Bakery)
- Revenue model: CPL (cost per lead) from SMBs targeting MIT audience ($5-15/qualified lead)

### Phase 3: API & Premium (1,000+ users)
- **API access**: Free tier (100 calls/day), Pro tier ($29/mo for 10K calls/day)
- **Premium badges**: "Verified Founder" ($9.99/mo), "Mentor Pro" ($4.99/mo)
- **Recruiting API**: Companies pay for anonymized talent signals (opt-in only)

### Phase 4: Scale (Multi-campus)
- **Meet[School]**: MeetHarvard, MeetStanford, MeetOxford
- **Cross-campus MeetMITs**: MIT × Harvard founder matches
- **Enterprise**: Corporate mentorship programs ("MeetMIT × Google")

---

## 10. Deployment Guide (Google Cloud)

### 10.1 Infrastructure

```bash
# Project setup
gcloud config set project meetmit-prod

# Cloud Run (backend)
gcloud run deploy meetmit-api \
  --source . \
  --region us-east1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,FIREBASE_PROJECT=meetmit-prod"

# Firestore
gcloud firestore databases create --location=us-east1

# Redis (Memorystore)
gcloud redis instances create meetmit-cache \
  --size=1 --region=us-east1 --redis-version=redis_7_0

# Cloud CDN (frontend static)
gcloud compute backend-buckets create meetmit-frontend \
  --gcs-bucket-name=meetmit-frontend-assets \
  --enable-cdn
```

### 10.2 Environment Variables

```env
# .env.production
NODE_ENV=production
PORT=8080

# Firebase
FIREBASE_PROJECT_ID=meetmit-prod
FIREBASE_API_KEY=AIza...
FIREBASE_AUTH_DOMAIN=meetmit-prod.firebaseapp.com

# Google Calendar API
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
GOOGLE_REDIRECT_URI=https://meetmit-api-xxx.run.app/api/auth/google/callback

# Redis
REDIS_URL=redis://10.x.x.x:6379

# Anthropic (for AI matching + invite drafting)
ANTHROPIC_API_KEY=sk-ant-xxxx

# Rate Limits
AGENT_RATE_LIMIT_PER_MIN=10
AGENT_RATE_LIMIT_PER_SESSION=50
USER_RATE_LIMIT_PER_MIN=30
```

### 10.3 Project Structure

```
meetmit/
├── client/                    # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SparkCard.jsx
│   │   │   ├── OfferCard.jsx
│   │   │   ├── AgentCard.jsx
│   │   │   ├── CampusMap.jsx
│   │   │   ├── VibeRadar.jsx
│   │   │   ├── MatchScore.jsx
│   │   │   ├── OnboardingFlow.jsx
│   │   │   └── NavTabs.jsx
│   │   ├── pages/
│   │   │   ├── Sparks.jsx
│   │   │   ├── Map.jsx
│   │   │   ├── Offers.jsx
│   │   │   ├── Agents.jsx
│   │   │   ├── AgentRegister.jsx
│   │   │   ├── AgentDetail.jsx
│   │   │   ├── AgentAdmin.jsx
│   │   │   ├── Trust.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── Onboarding.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useSparks.js
│   │   │   ├── usePresence.js
│   │   │   └── useAgents.js
│   │   ├── utils/
│   │   │   ├── affinity.js
│   │   │   ├── api.js
│   │   │   └── constants.js
│   │   ├── styles/
│   │   │   └── globals.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── server/                    # Express backend
│   ├── routes/
│   │   ├── auth.js
│   │   ├── profile.js
│   │   ├── sparks.js
│   │   ├── sessions.js
│   │   ├── offers.js
│   │   ├── map.js
│   │   ├── agents.js
│   │   ├── trust.js
│   │   ├── insights.js
│   │   └── admin.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── rateLimiter.js
│   │   ├── agentAuth.js
│   │   └── errorHandler.js
│   ├── services/
│   │   ├── affinityEngine.js
│   │   ├── calendarSync.js
│   │   ├── matchmaker.js
│   │   ├── agentOrchestrator.js
│   │   ├── notificationService.js
│   │   └── activityLogger.js
│   ├── models/
│   │   └── schemas.js        # Firestore document schemas (validation)
│   ├── config/
│   │   ├── firebase.js
│   │   ├── redis.js
│   │   └── env.js
│   ├── index.js               # Express app entry
│   └── package.json
│
├── shared/                    # Shared types/constants
│   ├── meetTypes.js
│   ├── oceanTraits.js
│   └── errorCodes.js
│
├── Dockerfile
├── cloudbuild.yaml
├── .env.production
├── .env.development
└── README.md
```

### 10.4 Cursor Instructions (paste into Cursor)

```
## CURSOR INSTRUCTIONS — meetMIT V2

You are building meetMIT V2, MIT's social capital engine. Follow this spec exactly.

### Stack
- Frontend: React 18 + Vite + Tailwind CSS + Framer Motion
- Backend: Node.js + Express on Google Cloud Run
- Database: Firestore
- Cache: Redis (Memorystore)
- Auth: Firebase Auth (email link / magic link for MIT .edu)
- AI: Anthropic Claude API (Sonnet) for affinity scoring + invite drafting
- Maps: Google Maps JavaScript API

### Build Order
1. Auth flow (MIT email magic link verification)
2. Onboarding flow (profile + Vibe Check quiz + mode selection)
3. Sparks tab (affinity engine + card feed + accept/reshuffle)
4. Offers tab (value exchange CRUD board)
5. Agents tab (HW3: registration, directory, interaction, rate limiting, moderation, observability)
6. Map tab (campus presence with Google Maps)
7. Trust tab (scores, badges, block/report)
8. Profile tab (settings, calendar connect, vibe radar)

### Design
- Dark mode primary (--midnight: #0D1117)
- MIT red accent (#A31F34)
- Font: Syne for headlines, Instrument Sans for body, IBM Plex Mono for stats
- Card-based UI with Framer Motion transitions
- Mobile-first responsive

### Key Behaviors
- All AI is framed as "matchmaker" or "helper", never "AI"
- One-tap interactions: MeetMIT (accept), Reshuffle (skip), Post (create offer)
- Calendar is always opt-in and read-only
- Agents are rate-limited: 10 msg/min, 50/session, 100/day
- MIT .edu emails only (Harvard cross-reg allowed for MIT events)

### Deploy
- Same Cloud Run service: meetmit-api-114661584115.us-east1.run.app
- Firestore in us-east1
- Redis Memorystore in us-east1
- Static assets on Cloud CDN bucket

### HW3 Compliance Checklist
- [ ] 6+ agents registered and interacting
- [ ] Self-onboarding agent registration form
- [ ] Agent directory with capabilities, status, last seen
- [ ] Rate limiting (10 msg/min per agent)
- [ ] Moderation (report button, admin pause/disable)
- [ ] Observability dashboard (active agents, sessions, errors, activity log)
- [ ] Idempotent API calls (idempotency_key header)
- [ ] Retry logic (3 attempts with backoff)
- [ ] Clear error messages (rate_limit_exceeded, agent_not_found, etc.)
```

---

## 11. Security & Privacy Checklist

- [ ] MIT `.edu` email verification (Firebase Auth magic link)
- [ ] JWT tokens with 1h expiry, refresh tokens with 7d expiry
- [ ] Calendar data: read-only OAuth scope, revocable anytime
- [ ] Presence sharing: opt-in, aggregated (never individual tracking without consent)
- [ ] Agent tokens: scoped per-agent, revocable by admin
- [ ] Rate limiting: per-user (30/min), per-agent (10/min)
- [ ] CORS: whitelist only meetmit domains
- [ ] Firestore security rules: users can only read/write own data
- [ ] HTTPS everywhere (Cloud Run enforces TLS)
- [ ] Block/report: immediate effect, logged for review
- [ ] Data export: users can download all their data (GDPR-ready)
- [ ] Campus geofence: presence features limited to MIT coordinates
- [ ] No PII in agent payloads (only uid references)
- [ ] Input sanitization on all user-facing fields

---

## 12. KPIs & Success Metrics

| Metric | Target (8 weeks) | Measurement |
|--------|-------------------|-------------|
| Registered users | 500 | Firestore user count |
| Weekly active users (WAU) | 200+ | Users with ≥1 session/week |
| Matches accepted | 60%+ | accepted / total suggested |
| Meets completed | 40%+ | completed / accepted |
| Average meet rating | 4.0+ / 5.0 | feedback scores |
| Offers posted | 100+ | total offers created |
| Agents registered | 8+ | agents collection count |
| Agent sessions/day | 20+ | activity log count |
| Referral rate | 2.0x | invited / inviter ratio |
| NPS | 50+ | monthly survey |

---

## 13. What Makes meetMIT Unbeatable

1. **MIT-only exclusivity**: The `.edu` gate creates scarcity and trust that open platforms cannot replicate. Every user is verified, extraordinary, and reachable.

2. **IRL-first in a feed-fatigued world**: While Fizz and Yik Yak optimize for scrolling, meetMIT optimizes for showing up. The output is a real human sitting across from you.

3. **Agentic AI that respects autonomy**: Unlike Moltbook (agents talking to agents), meetMIT uses agents to serve humans. The human always decides, always controls, always meets.

4. **Value exchange as social currency**: "I'll buy coffee for GTM feedback" is the MIT version of marketplace dynamics. It's Craigslist meets Bumble BFF meets Y Combinator office hours.

5. **Campus presence map**: No other campus app shows you who's free, where, right now. This is the "Uber map" moment for MIT social life.

6. **Network effects with teeth**: Every new user makes every existing user's matches better. At 500 users, the match quality crosses a threshold where the app becomes indispensable.

7. **API-first for builders**: MIT students want to build on things. The public API turns meetMIT into infrastructure, not just an app.

---

*Built for MIT. By MIT. To meet MIT.*
*You came to MIT to meet extraordinary people. meetMIT will help you find them.*
