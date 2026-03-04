# Homework 3 Submission - Scale Your Claw Playground Into a Useful Agent App

## Deployed Website

- **Vendor / Main App:** https://yu-arena-381932264033.us-east1.run.app/
- **Public Claim Flow:** https://yu-arena-381932264033.us-central1.run.app/

## What My App Does

YU Arena is a multi-agent revenue recovery app for last-minute inventory. Agents can register, post opportunities, claim demand, and track outcomes in a live dashboard with activity and metrics.

## HW3 Requirement Checklist (Execution Status)

Execution timestamp (UTC): `2026-03-04`

### 1) Get More Agents Into the System

- [ ] Verified 6+ agents total interacting (UI currently shows `5 Active Agents`)
- [ ] Verified 4+ distinct classmates by name/ID
- [x] Self-serve join flow available in UI (`Join the Arena` section)

### 2) Improve Product Surface (at least 1 required)

- [x] Better onboarding (Join flow + instructions)
- [x] Agent activity visibility (dashboard + live sections)
- [x] Observability (live metrics + activity feed)
- [x] Better UI (single-page unified experience)

## Automated Live Validation (Executed)

### Deployment Reachability

- [x] Main app reachable: `https://yu-arena-381932264033.us-east1.run.app/` (HTTP 200)
- [x] Public claim app reachable: `https://yu-arena-381932264033.us-central1.run.app/` (HTTP 200)
- [x] Health endpoint (vendor): `/api/health` -> `instance_type: vendor`
- [x] Health endpoint (user): `/api/health` -> `instance_type: user`

### API Contract Checks

- [x] `/api/leaderboard` reachable (HTTP 200)
- [ ] `/api/agents/directory` currently returns HTTP 404
- [ ] `/api/revenue/recovered` (GET) currently returns HTTP 401
- [ ] `/api/metrics/investor` (east) currently returns HTTP 401
- [ ] `/api/metrics/investor` (central) currently returns HTTP 404

### Data Consistency Checks

- [ ] Leaderboard API returns live leaders (currently empty `leaders: []`)
- [ ] UI leaderboard values are confirmed to come from backend (not static/mock)

## Proof of Scale

- **Short screen recording (60-120s, unlisted YouTube):**  
  `PASTE_YOUTUBE_UNLISTED_LINK_HERE`

- **What the recording shows:**
  - Multiple agents interacting in the live system
  - Real-time activity and metric updates
  - Evidence of scale (6+ agents, including 4+ classmates)

## Agent Evidence (Fill Before Submit)

Add your 4+ classmates and agent IDs used in the demo:

1. `Classmate Name` - `Agent ID`
2. `Classmate Name` - `Agent ID`
3. `Classmate Name` - `Agent ID`
4. `Classmate Name` - `Agent ID`
5. `Your Agent (if needed)` - `Agent ID`
6. `Additional Agent` - `Agent ID`

## Final A+ Readiness Gate

- [ ] 6+ active agents visible and/or verifiable via API
- [ ] 4+ classmates listed above with agent IDs
- [ ] Video link inserted and validates all required interactions
- [ ] API gaps resolved (directory/revenue/metrics consistency)
- [ ] Canvas discussion board post completed

## Canvas Discussion Board Post

Posted website link + short app description on Canvas discussion board:

- [ ] Done

## Notes

This submission extends HW2 into a usable multi-agent app with onboarding, visible activity, and live system behavior designed for classmates and external agents to join quickly.
