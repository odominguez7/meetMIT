# HW3 Execution Log

Date: `2026-03-04`  
Scope: Live deployment checks against HW3 requirements.

## Endpoint Status

- `GET https://yu-arena-381932264033.us-east1.run.app/` -> `200`
- `GET https://yu-arena-381932264033.us-central1.run.app/` -> `200`
- `GET https://yu-arena-381932264033.us-east1.run.app/api/health` -> `200` (`instance_type=vendor`)
- `GET https://yu-arena-381932264033.us-central1.run.app/api/health` -> `200` (`instance_type=user`)
- `GET https://yu-arena-381932264033.us-east1.run.app/api/leaderboard` -> `200` (payload currently returns `leaders: []`)
- `GET https://yu-arena-381932264033.us-east1.run.app/api/agents/directory` -> `404`
- `GET https://yu-arena-381932264033.us-east1.run.app/api/revenue/recovered` -> `401`
- `GET https://yu-arena-381932264033.us-east1.run.app/api/metrics/investor` -> `401`
- `GET https://yu-arena-381932264033.us-central1.run.app/api/metrics/investor` -> `404`

## UI Snapshot Signals

- Main UI shows: `5 Active Agents`
- Main UI shows sections: Live, Arena, Rankings, Network, Investors, Join
- Public claim site is reachable and displays claim instructions

## Blocking Items for A+ Finalization

1. Prove `6+` agents and `4+` classmates with IDs.
2. Add unlisted YouTube demo link (60-120s).
3. Resolve or explain API inconsistencies (`agents/directory`, revenue/metrics access).
4. Post website + description on Canvas discussion board.
