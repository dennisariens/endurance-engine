# AERION-001 — Baseline and source reconciliation audit

Completed: 2026-10-02  
Audit branch: `codex/aerion-001-baseline-audit`  
Verified remote base: `refactor/v2-foundation` @ `01db3bf5dc4d2c9cdf0dd9a82d98939cfdd2d315`

## Result

The remote product source is coherent enough to remain the current authority, but branch promotion to `main` is not safe yet. `main` is a separate minimal placeholder history. The product branch contains the real React/TypeScript/Vite/Electron app and the current coaching/data engines.

The connected GitHub audit cannot inspect Dennis's live Mac working tree. Earlier local inspection established that `refactor/v2-foundation` was available locally and typecheck/build passed, with 160/164 tests passing; four evidence-store/API tests failed because the system `sqlite3` binary was expected but unmanaged. No exact current `git status`, modified/untracked file list, local SHA, or current runtime screenshot/console proof was durably recorded. Therefore local-only work is treated as protected and unknown rather than assumed absent.

## Verification evidence

- Repository: `dennisariens/endurance-engine`.
- Product branch: `refactor/v2-foundation`.
- Remote base: `01db3bf5dc4d2c9cdf0dd9a82d98939cfdd2d315`.
- Audit/workflow commit before this report: `56ddc1d107b40f2bd880decae3a6264bbcd00717`.
- Historical local verification: typecheck passed; build passed; 160/164 tests passed.
- Known test limitation: four SQLite-backed evidence/API tests depended on an unmanaged system `sqlite3`.
- Current connected environment cannot run the repository or inspect the Mac checkout; container network access to GitHub is unavailable.
- No production deployment is recorded.

## Architecture and data findings

### Confirmed

1. **App orchestration concentration** — `src/App.tsx` directly wires most product state, derived engines, logging and expert panels. This is a maintainability risk, not an immediate correctness failure.
2. **Vite middleware is the backend boundary** — `vite.config.ts` serves `/api/sync` and `/api/briefing`. This is acceptable for the local-first prototype but not a durable backend architecture.
3. **Fixture contamination risk is real** — `useAerionState.ts` bootstraps activities, races, goals and current state from repository JSON when local storage is absent/reset.
4. **A hardcoded manual activity is present** — `data/activities.json` contains `manual-20260430-sort-like-activity`, so a fresh/reset installation can load a non-authoritative manual record into coaching state.
5. **Historical current-state fixture is stale** — `data/current-state.json` is dated 2026-04-30 and includes a red recovery state, old race context and eFTP 333 W. It can become authoritative after reset/first load if not clearly isolated.
6. **Manual records bypass synced dedupe** — `dedupeSyncedActivities` removes manual activities from the dedupe map and prepends them unchanged. The declared manual source priority is therefore not used to resolve manual-vs-synced duplicates.
7. **Coach context has a canonical-state path** — `aerionBriefingContextEngine.ts` builds evidence, freshness and `CanonicalAthleteState`, which is a sound direction.
8. **Live/fixture context remains distinguishable but not fully enforced** — briefing context defaults to `local-fixture`; a stronger guard is needed so fixture state cannot silently masquerade as current athlete truth.
9. **Garmin/Strava are not proven live OAuth** — current imports are JSON adapter/manual flows; Intervals.icu is the proven live sync boundary.

### Disproved / narrowed

- The earlier concern that there are two independent synced-activity dedupe implementations is not supported by the inspected source: opening sync, Strava import and UI activity additions all call the shared `dedupeSyncedActivities` function. The remaining risk is its identity strategy and manual-record bypass, not duplicated algorithms.
- MCP/app state drift is reduced by the shared canonical state builder, but can still occur if MCP/briefing receives different input evidence or stale fixtures than the UI.

## Preservation plan

- Keep `refactor/v2-foundation` as product authority.
- Do not merge or force-rebase into `main`.
- Do not reset, clean or overwrite the Mac checkout.
- Treat any uncommitted/untracked Mac files as protected until explicitly inventoried.
- Any next implementation should use a new `codex/<task>` branch and avoid broad UI/refactor work until the local checkout is reconciled.
- Before a future canonical-branch promotion, capture on the Mac: branch, HEAD SHA, `git status --short`, untracked paths, diff summary, verification gate results and runtime/console proof.

## Canonical branch recommendation

For now, keep `refactor/v2-foundation` as canonical product authority and leave `main` untouched. Promotion to `main` is a later migration task requiring explicit preservation of local-only Mac work and a deliberate unrelated-history strategy.

## Safest next product task

**AERION-002 — Real-state bootstrap and activity identity guardrails**

Goal: prevent repository fixtures/manual defaults from silently becoming athlete truth and make activity identity/provenance deterministic before adding more coaching intelligence.

Boundaries:
- pure data/state logic and tests first;
- no redesign;
- no backend migration;
- no local-data reset;
- no branch promotion;
- no new coaching rule;
- preserve existing Intervals sync and import contracts.

Minimum acceptance:
- fixture/default records are explicitly marked and excluded from live coaching authority when real data exists;
- the hardcoded manual placeholder cannot pollute current athlete state;
- manual-vs-synced duplicate behavior is explicit and tested;
- reset/demo behavior is separated from real-state bootstrap;
- test/typecheck/build results are recorded.
