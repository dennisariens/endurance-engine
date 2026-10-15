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

## Mac reconciliation follow-up — 2026-10-15

This follow-up supersedes the earlier statement that the Mac inventory and runtime proof were unavailable.

### Exact source state

- Mac checkout: `refactor/v2-foundation` @ `01db3bf5dc4d2c9cdf0dd9a82d98939cfdd2d315`.
- Configured upstream after fetch: `origin/refactor/v2-foundation` @ `56ddc1d107b40f2bd880decae3a6264bbcd00717`.
- Audit branch before this follow-up: `origin/codex/aerion-001-baseline-audit` @ `4b95ad005854009ff2a0efdeefadfe1a19119ef2`.
- Placeholder `main`: `e2c382de7e8e7809817c59ac335b437f30f44ef8`; it still has no merge base with the product history.
- Local `master`: `ec39274f2a82f138615ed6dcde6d272b645c45b2`; it is an ancestor of the product branch and is already reachable from both remote product and audit branches.
- Working tree: no tracked modifications and no non-ignored untracked files.
- Local product branch divergence: `+0 / -1`; it is behind only the remote workflow/documentation commit `56ddc1d`.
- No stash entries and no commits exist only on local branches.
- Ignored local data, dependency and generated output remain preserved. Their contents were not inspected or changed; `.env.local` was not read or exposed.

The source code at the baseline, current remote product branch and audit branch is identical. `56ddc1d` adds project workflow/documentation only; the audit branch adds audit/task/handoff documentation only.

One remote-only workflow defect blocks a blind Mac fast-forward: the tree contains both existing `docs/architecture.md` and newly added `docs/ARCHITECTURE.md`. These are distinct in Git but collide on the default case-insensitive macOS filesystem. A temporary Mac worktree demonstrated that checking out/restoring one path marks the other as modified. Neither file was included in this follow-up commit. Resolve the duplicate path deliberately before updating the main Mac checkout.

### Verification rerun on the Mac

Executed against the clean baseline checkout at `01db3bf5dc4d2c9cdf0dd9a82d98939cfdd2d315`:

- `npm test`: passed — 52 test files, 164 tests.
- `npm run typecheck`: passed.
- `npm run build`: passed — Vite 8.0.10, 2,368 modules transformed.

The previously recorded SQLite failure is not reproducible in the current Mac environment: all evidence-store and API tests passed. `sqlite3` remains an unmanaged external runtime dependency and should still be made explicit in a later bounded task.

### Runtime and interface evidence

- Vite served the app at `http://127.0.0.1:5174/`; `/` and `/api/sync` both returned HTTP 200.
- A fresh isolated Chrome profile loaded the rendered app. Console output contained only Vite connection messages and the React DevTools notice; no application exception was observed. Headless Chrome emitted macOS display-link diagnostics, which are browser-environment noise rather than app errors.
- Evidence captures: desktop `1440×1100`, tall desktop `1440×2600`, and mobile `390×844`.

Visible discrepancies:

1. Desktop hero typography collides: the magenta “HOW ARE YOU?” label is obscured by the oversized “HOLD” headline, and the first viewport clips lower hero content.
2. Fresh-profile fixture state is visibly stale/conflicting: on 2026-10-15 the UI shows “No fixed race” while continuing to present `IRONMAN LANZAROTE · 2026-10-01` as the active mission with red/extreme recovery guidance.
3. Recovery guidance is repeated across the hero, status columns, action panel and weekly card. The visible `37` and `35` values are not clearly differentiated.
4. At `390×844`, the desktop-style navigation remains expanded, produces horizontal clipping, truncates labels/date controls and pushes the primary race-control answer below the fold.
5. The tall desktop page continues below the first viewport without obvious horizontal overflow, but uses large sparse panels and heavily wrapped risk copy; the capture does not reach a definitive page end.

No UI, data or coaching-rule change was made during this audit.

### Updated canonical-branch recommendation

Keep `refactor/v2-foundation` as the sole product authority until the audit documentation is reviewed. Do not merge unrelated `main` history.

Safest promotion sequence, each step requiring explicit approval:

1. Preserve immutable refs for the placeholder `main`, product branch and accepted audit head.
2. Resolve the `docs/architecture.md` / `docs/ARCHITECTURE.md` case collision in a bounded documentation commit, preserving both contents under unambiguous paths.
3. Review and fast-forward the audit documentation into the product history.
4. Fast-forward the clean Mac checkout to the accepted product/audit state; do not reset local data.
5. Archive/rename the unrelated placeholder `main`.
6. Either make `refactor/v2-foundation` the GitHub default branch immediately, or rename that branch to `main` after the placeholder is archived. A branch rename/default switch is safer than an unrelated-history merge or force-push.
7. Add branch protection and verify a fresh clone on macOS before retiring historical aliases.

### Product context recorded, not implemented

- Tuesday ZRL is no longer a fixed training obligation before the 15 November marathon.
- Long runs may float based on recovery.
- Injury-aware scheduling and progressive home strength training are future product requirements, outside AERION-001.
