# Codex → Work

Task: AERION-001  
Status: completed with Mac reconciliation evidence
Base: `01db3bf5dc4d2c9cdf0dd9a82d98939cfdd2d315`  
Audit report: `docs/AERION-001-AUDIT.md`  
Task archive: `tasks/AERION-001.md`

## Result

Remote and Mac source are reconciled. The clean Mac checkout is exactly the requested product baseline `01db3bf5dc4d2c9cdf0dd9a82d98939cfdd2d315`; the remote product branch is one workflow/documentation commit ahead at `56ddc1d107b40f2bd880decae3a6264bbcd00717`. Product code is identical across the baseline, remote product branch and audit branch. `main` remains an unrelated minimal placeholder. No merge, promotion, reset, cleanup, feature change or deployment was performed.

## Checks / evidence

- `npm test`: passed — 52 files, 164 tests.
- `npm run typecheck`: passed.
- `npm run build`: passed — Vite 8.0.10, 2,368 modules transformed.
- The historical four-test SQLite failure was not reproduced; evidence-store/API tests passed.
- Vite runtime: `/` and `/api/sync` returned HTTP 200 at `127.0.0.1:5174`.
- Fresh isolated Chrome profile: no application console exception; desktop and mobile captures recorded in the audit report.

## Mac working-tree inventory

- Branch/HEAD: `refactor/v2-foundation` @ `01db3bf5dc4d2c9cdf0dd9a82d98939cfdd2d315`.
- Working tree: no tracked modifications and no non-ignored untracked files.
- Divergence: `+0 / -1` from `origin/refactor/v2-foundation`.
- Stash: empty. Local-only commits: none.
- Ignored local data and generated/dependency output remain preserved and uninspected; `.env.local` was not read or exposed.

## Architecture/data findings

- `App.tsx` is an orchestration concentration point.
- Vite middleware owns `/api/sync` and `/api/briefing`.
- Historical repository fixtures can bootstrap live local state.
- `data/activities.json` contains a hardcoded manual placeholder activity.
- `data/current-state.json` is stale April 2026 state and can become authoritative after fresh/reset bootstrap.
- Synced imports share one dedupe implementation; the earlier duplicate-algorithm concern is narrowed.
- Manual activities bypass the synced dedupe map, leaving a real provenance/identity risk.
- Canonical athlete state and briefing-context construction are present and should be preserved.
- Garmin/Strava remain adapter/manual-import stage; Intervals.icu is the proven live sync boundary.
- Remote documentation contains a macOS case collision: `docs/architecture.md` and `docs/ARCHITECTURE.md`. Resolve it before fast-forwarding the Mac checkout.

## Canonical plan

Keep `refactor/v2-foundation` as product authority and leave `main` untouched pending approval. First resolve the documentation case collision, then accept the audit docs and preserve immutable refs. Archive the unrelated placeholder `main`, then switch the default branch to the product history or rename the product branch to `main`. Do not merge unrelated histories or force-push.

## Recommended next task

AERION-002 — Real-state bootstrap and activity identity guardrails. See `tasks/ACTIVE.md`.

New context recorded without implementation: Tuesday ZRL is not fixed before the 15 November marathon; long runs can float with recovery; injury-aware scheduling and progressive home strength remain future requirements.

Deployment: none
