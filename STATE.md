# Current state

Updated: 2026-10-02 · OS version: 1

## Repository truth

- Repository: https://github.com/dennisariens/endurance-engine
- Current remote product authority: `refactor/v2-foundation`
- Verified product base: `01db3bf5dc4d2c9cdf0dd9a82d98939cfdd2d315`
- `main` contains only a minimal README and has unrelated history; it is not canonical.
- AERION-001 audit branch: `codex/aerion-001-baseline-audit`
- AERION-001 evidence: `docs/AERION-001-AUDIT.md`

## Product state

Remote source is a React/TypeScript/Vite/Electron local-first app with Intervals.icu opening sync, local persistence, coaching engines, race-cost logic, 72-hour planning, scenarios, Goal Readiness, Path to Goal, data import/export and an expert/debug layer.

The premium shell is present. Canonical athlete state and evidence/freshness builders exist and should remain the basis for coaching context.

AERION-001 confirmed a live-state bootstrap risk: repository fixture JSON can seed athlete state on a fresh/reset install. The historical activity fixture contains a hardcoded manual placeholder and the current-state fixture is stale April 2026 evidence. Manual activities also bypass the synced dedupe map.

The exact current Mac working-tree inventory is not durably recorded, so any local-only modified/untracked work is treated as protected. Do not reset, clean, overwrite or promote branches until that inventory is captured.

## Verification evidence

- Prior local audit: typecheck passed.
- Prior local audit: build passed.
- Prior local audit: 160/164 tests passed.
- Four SQLite-backed evidence/API tests failed because `sqlite3` was expected from the system rather than managed by the project.
- No current production deployment is recorded.

## Operating model

- **HR Chest Strap Insights** is the single main Aerion chat.
- Work/director and Codex are execution roles behind it.
- GitHub task and handoff files carry durable state between conversation histories.
- Aerion athlete/coaching state remains separate from the Eagles Race Engine.

## Hosting and integrations

- Primary runtime: local Mac app / Vite at `127.0.0.1:5174`; Electron packaging is configured.
- Intervals.icu uses the server-side `/api/sync` boundary when credentials are present.
- Garmin and Strava are adapter/manual-import stage unless fresh evidence proves live OAuth.
- Vite middleware currently also serves `/api/briefing`.

## Next

AERION-002: real-state bootstrap and activity identity guardrails. No redesign, data reset, backend migration, branch promotion, deployment or new coaching rule is authorized.
