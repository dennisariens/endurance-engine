# Current state

Updated: 2026-10-02 · OS version: 1

## Repository truth

- Repository: https://github.com/dennisariens/endurance-engine
- Current remote product branch: `refactor/v2-foundation`
- Verified base commit: `01db3bf5dc4d2c9cdf0dd9a82d98939cfdd2d315`
- `main` contains only a minimal README and has no common ancestor with the product branch.
- Audit branch: `codex/aerion-001-baseline-audit`

## Product state

Remote source is a React/TypeScript/Vite/Electron local-first app with Intervals.icu opening sync, local persistence, coaching engines, race-cost logic, 72-hour planning, scenarios, Goal Readiness, Path to Goal, data import/export and an expert/debug layer.

The redesigned premium shell is present on the product branch. A previous local audit reported additional modified and untracked Mac files, so the remote branch may not contain Dennis's newest working state. That local state must be inventoried before promotion, cleanup or broad implementation.

## Operating model

- **HR Chest Strap Insights** is the single main Aerion chat.
- Work/director and Codex are execution roles behind it.
- GitHub task and handoff files carry durable state between conversation histories.
- Aerion athlete/coaching state remains separate from the Eagles Race Engine.

## Hosting and integrations

- Primary runtime: local Mac app / Vite at `127.0.0.1:5174`; Electron packaging is configured.
- Intervals.icu uses the server-side `/api/sync` boundary when credentials are present.
- Garmin and Strava are adapter/manual-import stage unless fresh evidence proves live OAuth.
- No production web deployment is recorded.

## Next

AERION-001: reconcile remote product source with the Mac checkout, run the verification gates, document architecture/data risks and recommend the safe canonical-branch plan. No redesign, data reset or deployment is authorized by setup.

