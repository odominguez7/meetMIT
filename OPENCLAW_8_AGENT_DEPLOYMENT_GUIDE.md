# OpenClaw 8-Agent Deployment Guide for meetMIT V2

This guide explains how to create, deploy, and register 8 OpenClaw-backed agents for meetMIT V2 with clear HW3 coverage.

---

## 0) Goal and Scope

You will deploy 8 distinct OpenClaw agents and register them in meetMIT's Agents system.

Success criteria:

- 8 agents registered in `GET /api/agents`
- each agent supports `POST /api/agents/:id/interact`
- rate limit, moderation, and observability are demonstrable
- all tokens and secrets are handled safely (no secrets in git)

---

## 1) Repos and Where to Push

Use two repos:

1. `HW3-AI-studio` (meetMIT app)
   - Contains registration routes/UI, directory, admin, observability, and interaction router.
   - Push branch: `feature/agents-hw3-step5`

2. OpenClaw runtime repo (`openClaw` or `agent-o`)
   - Contains agent endpoint logic and deployment config.
   - Push branch: `feature/meetmit-openclaw-agents`

Recommended merge path:

- push both feature branches
- validate end-to-end
- merge each to `main`

---

## 2) Agent Types and Target Mix

Use these allowed types from spec:

- `study-helper`
- `founder-advisor`
- `wellness`
- `moderator`
- `custom`

Recommended 8-agent mix:

- 3 x `study-helper`
- 2 x `founder-advisor`
- 1 x `wellness`
- 1 x `moderator`
- 1 x `custom`

---

## 3) Agent Identity Set (Use As-Is)

1. `StudyBot-6006` (`study-helper`)
2. `ProbMind-6036` (`study-helper`)
3. `SystemsMentor-6033` (`study-helper`)
4. `GTM-Advisor-MIT` (`founder-advisor`)
5. `PitchCoach-Seed` (`founder-advisor`)
6. `WellnessPulse` (`wellness`)
7. `SafetyMod-01` (`moderator`)
8. `CampusGraphX` (`custom`)

---

## 4) Endpoint Contract (OpenClaw Side)

Each OpenClaw agent endpoint must accept:

```json
{
  "task": "string",
  "context": {},
  "meetmit_user": "uid"
}
```

Each endpoint should return:

```json
{
  "result": "string",
  "confidence": 0.0,
  "next_actions": []
}
```

Auth header expected from meetMIT:

- `Authorization: Bearer agnt_xxx`

---

## 5) OpenClaw Runtime Layout (Recommended)

Use one service with multiple routes:

```txt
/agents/studybot-6006/task
/agents/probmind-6036/task
/agents/systemsmentor-6033/task
/agents/gtm-advisor-mit/task
/agents/pitchcoach-seed/task
/agents/wellnesspulse/task
/agents/safetymod-01/task
/agents/campusgraphx/task
```

Each route maps to a distinct persona and capability policy.

---

## 6) Environment Variables and Secrets

Do not commit secrets.

Use runtime env/secret manager for:

- `OPENCLAW_AGENT_TOKEN_STUDYBOT_6006`
- `OPENCLAW_AGENT_TOKEN_PROBMIND_6036`
- `OPENCLAW_AGENT_TOKEN_SYSTEMSMENTOR_6033`
- `OPENCLAW_AGENT_TOKEN_GTM_ADVISOR_MIT`
- `OPENCLAW_AGENT_TOKEN_PITCHCOACH_SEED`
- `OPENCLAW_AGENT_TOKEN_WELLNESSPULSE`
- `OPENCLAW_AGENT_TOKEN_SAFETYMOD_01`
- `OPENCLAW_AGENT_TOKEN_CAMPUSGRAPHX`

Store only placeholders in `.env.example`.

---

## 7) Deploy OpenClaw Service (Cloud Run)

From OpenClaw repo:

```bash
gcloud config set project meetmit
gcloud run deploy openclaw-agents \
  --source . \
  --region us-east1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production"
```

After deploy, save base URL:

```txt
https://openclaw-agents-<hash>-ue.a.run.app
```

---

## 8) Register 8 Agents in meetMIT

For each agent, call:

```bash
curl -X POST "https://<meetmit-service>/api/agents/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "StudyBot-6006",
    "capabilities": ["6.006", "algorithms", "p-set planning"],
    "endpoint": "https://<openclaw-service>/agents/studybot-6006/task",
    "contact_email": "you@mit.edu",
    "agent_type": "study-helper"
  }'
```

Repeat for all 8 identities using their matching route/type/capabilities.

Save each returned `agent_token` securely.

---

## 9) Suggested Capabilities Per Agent

- `StudyBot-6006`: `6.006`, `algorithms`, `p-set planning`
- `ProbMind-6036`: `6.036`, `probability`, `exam drills`
- `SystemsMentor-6033`: `6.033`, `systems design`, `debug workflows`
- `GTM-Advisor-MIT`: `GTM`, `ICP`, `messaging`
- `PitchCoach-Seed`: `pitch deck review`, `fundraising prep`, `narrative`
- `WellnessPulse`: `stress check-ins`, `focus routines`, `burnout prevention`
- `SafetyMod-01`: `report triage`, `policy tagging`, `escalation`
- `CampusGraphX`: `warm intros`, `network graph hints`, `event matching`

---

## 10) Post-Registration Validation Checklist

### Directory

- `GET /api/agents` shows 8 agents
- status is `active`
- capabilities display correctly

### Interaction

- `POST /api/agents/:id/interact` succeeds for each agent
- endpoint response shape is valid JSON

### Rate Limiting

- exceed 10 messages/minute for one agent
- confirm `429 {"error":"rate_limit_exceeded"}`

### Moderation

- submit `POST /api/agents/:id/report`
- pause via `PATCH /api/agents/:id/status` = `paused`
- confirm paused agent interaction blocked

### Observability

- `GET /api/admin/observability` shows counts and errors
- `GET /api/admin/activity-log` includes registration/interactions/reports

---

## 11) Idempotency and Retry Verification

### Idempotency

Call interaction twice with same `x-idempotency-key`:

- first call executes
- second call returns cached result

### Retry

Temporarily point one agent endpoint to a failing URL:

- confirm 3 retries with backoff
- final error should be clear (e.g., `agent_unreachable`)

---

## 12) Demo Script (Recommended for HW3)

1. Show 8 agents in directory
2. Interact with one study helper and one founder advisor
3. Trigger rate limit on one agent
4. Report and pause one agent
5. Show observability dashboard updates
6. Resume paused agent and show recovery

---

## 13) Common Failure Modes and Fixes

- `agent_not_found`: wrong ID in route
- `agent_paused`: set status back to `active`
- `rate_limit_exceeded`: wait window reset or use another agent
- `agent_unreachable`: endpoint URL down or auth mismatch
- `401/403`: invalid `agent_token` or missing header

---

## 14) Git Push Commands (Both Repos)

### meetMIT repo

```bash
cd "/path/to/HW3-AI-studio"
git checkout -b feature/agents-hw3-step5
git add .
git commit -m "Implement Step 5 agents platform and registration flows"
git push -u origin feature/agents-hw3-step5
```

### OpenClaw repo

```bash
cd "/path/to/openClaw"
git checkout -b feature/meetmit-openclaw-agents
git add .
git commit -m "Add 8 OpenClaw meetMIT agent endpoints and policies"
git push -u origin feature/meetmit-openclaw-agents
```

---

## 15) Final Deliverables for HW3

- 8 active registered agents
- working interaction endpoint per agent
- validated rate limiting
- moderation (report + pause/activate)
- observability metrics and logs
- idempotency + retry behavior demonstrated

This setup gives full, concrete evidence of the HW3 agent requirements in a production-style architecture.
