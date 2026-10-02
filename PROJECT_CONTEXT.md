# AERION — Project context snapshot

Updated: 2026-10-02. Current repository files override this snapshot when they differ.

## Identity

AERION is Dennis Ariens' private, local-first AI endurance coach and performance control system. It integrates running and cycling around real completed activity, recovery and fixed races. It is separate from the Eintracht Frankfurt Eagles Race Engine.

## Current mission

Primary athletic goal: sub-3 marathon on 15 November 2026 at approximately 4:16/km, while preserving cycling racing and combined-load intelligence. Chest-strap HR is the primary heart-rate source for important sessions.

## Product contract

- Reality > plan; actual completed work is authoritative.
- Fixed races stay fixed unless injury or illness is present.
- Recommendations are advisory and explain consequences without judgment.
- Predictions use ranges/confidence.
- Private and local-first; secrets remain server-side.
- Premium athlete-first design, using Breakaway/Rapha/MAAP/EF Cycling as behavioural references only.

## Repository state

- Product source: `refactor/v2-foundation` at `01db3bf5dc4d2c9cdf0dd9a82d98939cfdd2d315`.
- `main` is a separate minimal placeholder history.
- Previous local audit found newer modified/untracked Mac work that is not proven present remotely.
- Active task: `tasks/ACTIVE.md` on `codex/aerion-001-baseline-audit`.

## Operating model

HR Chest Strap Insights is the single front door. The assistant decides whether to handle work directly or scope it for Codex, reviews the result, updates GitHub state and reports back in plain language. Separate conversation histories do not automatically synchronize; GitHub is the durable relay.

## Known audit risks

- `src/App.tsx` is an orchestration bottleneck.
- Vite middleware currently acts as the backend boundary.
- Two activity dedupe paths may coexist.
- A hardcoded manual activity may pollute real state.
- Historical fixtures may distort current recommendations.
- MCP coach context can drift from app state.
- Garmin/Strava are not proven live OAuth integrations.

