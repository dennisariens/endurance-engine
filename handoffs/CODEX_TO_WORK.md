# Codex → Work

Task: AERION-001  
Status: completed with external preservation gate  
Base: `01db3bf5dc4d2c9cdf0dd9a82d98939cfdd2d315`  
Audit report: `docs/AERION-001-AUDIT.md`  
Task archive: `tasks/AERION-001.md`

## Result

Remote product source is established: `refactor/v2-foundation` remains authoritative and `main` remains an unrelated minimal placeholder. No merge, promotion, reset, cleanup or deployment was performed.

## Checks / evidence

- Prior local audit: typecheck passed.
- Prior local audit: production build passed.
- Prior local audit: 160/164 tests passed.
- Four evidence-store/API tests failed because an unmanaged system `sqlite3` binary was expected.
- Connected GitHub environment cannot inspect Dennis's current Mac working tree or run the app locally.
- Container-side clone/test retry was unavailable because outbound GitHub DNS/network access is disabled in that runtime.

## Mac working-tree inventory

Exact current inventory is not durably available. Earlier evidence confirms the product branch was available locally, but no current `git status --short`, untracked-file list, local HEAD or current runtime proof was captured. Local-only work is therefore treated as protected and unknown.

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

## Canonical plan

Keep `refactor/v2-foundation` as product authority. Leave `main` untouched. Before future promotion, capture the Mac branch/HEAD/status/untracked files/diff summary plus verification and runtime/console proof.

## Recommended next task

AERION-002 — Real-state bootstrap and activity identity guardrails. See `tasks/ACTIVE.md`.

Deployment: none
