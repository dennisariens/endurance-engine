# AERION — Hermes P2.2: Data Integrity & Reliability

## Review routing and source baseline

- Owner/reviewer: AERION Main. Direct GitHub delivery; no Work routing.
- Branch: `hermes/aerion-v3-data-integrity`.
- Implementation base: PR #9, `codex/aerion-v3-home` at `f585254a06878a8c8364e58b137d609bf91f2864`.
- Canonical product source remains `refactor/v2-foundation` at `56ddc1d107b40f2bd880decae3a6264bbcd00717`; PR #9 is open/unmerged.
- This is a deliberately stacked implementation PR targeting `codex/aerion-v3-home`. Do not merge independently into the canonical branch before #9 is accepted. Retarget only after its accepted commits are present.
- PR #9 advanced during this work to `b93ba07d1094d46961bec76d8618f63340a636bd`. Its added files concern branding, theme, browser QA and P2.1 evidence; none overlaps this implementation's data/API files. No in-progress Codex work was merged or overwritten.
- Implementation runs in a separate temporary sparse clone/worktree. The sparse checkout excludes `docs/` to avoid the existing `docs/architecture.md` / `docs/ARCHITECTURE.md` macOS collision.
- Active Mac checkout and runtime remain unchanged at `01db3bf5dc4d2c9cdf0dd9a82d98939cfdd2d315`.

## Resolved data-integrity problems

1. **Observation time versus import time.** `CurrentState.field_evidence` carries per-field observation time, source and reported/derived/legacy quality. Existing data is retained; legacy aggregate dates are explicitly marked legacy instead of fabricating measured timestamps.
2. **Partial imports refreshing old measurements.** Garmin and Intervals adapters stamp only supplied fields; sparse Intervals wellness days retain each metric's actual observation date. Missing values do not erase existing values. Zero remains a measurement.
3. **Recovery import conflicts.** Merge by field, not one aggregate date. Preserve newer local values; flag older/undated/same-time disagreements; allow missing fields to be filled independently. Unrelated imports cannot clear unresolved field conflicts. A strictly newer observation for that field resolves its generated conflict. The two recognized legacy generic warnings migrate conservatively to all existing measured recovery fields; partial updates retain warnings for untouched fields, and arbitrary review flags remain. If the old warning has no identifiable existing recovery fields, it remains for explicit review.
4. **General health adapter consistency.** Select the latest observed sample per metric, use source priority only for ties, retain per-field provenance, and route its merge through the same conflict policy. Existing recovery-score calculation is unchanged; derived scores are labelled derived and retain the oldest contributing date (or unknown if any contribution is undated).
5. **Stale-data transparency.** Coaching provenance exposes field age/status and does not call stale recovery inputs current because another field was imported today. Shared readiness freshness uses readiness observation time after per-field migration. Activity evidence quality/age is calculated per activity rather than borrowing the newest activity's freshness. For compatibility with existing Home consumers, `last_updated` remains the recovery score's observation date when a score exists (including unknown for explicitly undated scores), otherwise the training-readiness date, otherwise the newest field date. No visual consumer was edited.
6. **Stable activity identity.** Repeated source IDs are consolidated before semantic buckets, so revised duration/load does not duplicate an activity. Repeated manual IDs are idempotent. The existing policy keeping distinct manual and synced activities separate is unchanged; no speculative cross-source identity rule was introduced.
7. **Unsupported references/projections.** Removed the hardcoded example marker run and unvalidated environmental/race-day/six-month pace numbers from marathon context. Actual matching activity references remain. These fields now say unavailable when unsupported; phase, scheduling, fixed-race, health-override and workout decision rules are unchanged. PR #9 already replaced illustrative chart histories with empty/unavailable series; no visual/chart files were edited here.
8. **Restore preflight.** Shared pure validation checks full v1/v2 backup/state structure, required collections, record fields/enums/numbers/dates, unique IDs, selected-goal references, optional settings/conversation and per-field provenance before any state setter. Both normal import and the expert/direct state boundary are guarded. Restore remains explicit replacement, not an implicit sync merge.
9. **Protected storage.** Auto-save cannot replace future-schema envelopes or corrupt user-owned JSON with the fallback returned by `loadLocal`.

## Browser-snapshot briefing API and GET migration

- GET remains fail-closed with HTTP 409, `code: BROWSER_SNAPSHOT_REQUIRED`, a machine-readable POST migration/schema, deprecation/link headers and `Cache-Control: no-store`.
- POST accepts an explicit browser snapshot only. Same-origin scheme and host are checked; malformed/cross-site origins fail safely. JSON/content type, strict record validation and a streamed byte limit protect the boundary.
- POST with missing, stale or conflicting recovery provenance returns HTTP 409 and a stable `COACHING_EVIDENCE_*` unavailable code, without unsupported default prescriptions/projections. This is an output-quality boundary, not a change to any coaching-engine decision or prescription algorithm. CLI/MCP expose only allowlisted evidence codes from a response header, never raw error bodies.
- No server snapshot cache, no fixture fallback, no provider fetch, no snapshot persistence and no cross-browser sharing were introduced.
- CLI and MCP share a bounded client. Opt in with `--snapshot FILE` / `--snapshot=FILE` or `AERION_SNAPSHOT_PATH`. A browser backup may be explicitly selected; only coaching fields are POSTed. A file path cannot be supplied through MCP tool arguments.
- Snapshot data and date are sent in the JSON POST body, not URL/query parameters. Redirects are refused. Error messages do not echo response bodies, paths, URLs or provider details.
- Existing GET clients without a browser snapshot receive actionable unavailability, not a fabricated briefing. They must migrate explicitly; preserving HTTP 200 with server-only data would falsely claim browser parity.
- CLI example: `npm run briefing:context -- --snapshot /path/to/current-local-backup.json --date YYYY-MM-DD`.
- MCP example: set `AERION_SNAPSHOT_PATH` in its private process environment before starting `npm run mcp:aerion-openai`.
- Treat exported snapshots as private files. Do not commit them or upload athlete data to public GitHub.

## Verification

Baseline before implementation: 180 tests passed; typecheck passed.

Implementation verification:

- `npm test`: 59 files / 324 tests passed.
- `npm run typecheck`: passed.
- `npm run build`: passed (Vite 8.0.10; 2,368 modules transformed).
- SQLite executable: `/usr/bin/sqlite3`, version 3.51.0. All three evidence-store tests and the API evidence-persistence test pass against disposable databases. The remaining API service tests also pass.
- Strict TDD used for new recovery, health merge, identity, storage, backup and HTTP/client regressions; failing assertions were observed before fixes.
- Real loopback HTTP tests cover legacy GET, explicit POST, malformed records, invalid dates, same-origin enforcement, bounded streamed bodies, content types, methods and sanitized failures.
- A separate isolated Vite server on port 5188 was exercised directly: GET returned the migration response; the live CLI correctly returned `COACHING_EVIDENCE_MISSING` for a synthetic empty recovery snapshot. An optional command to filter a second CLI output was blocked by the safety gate and explicitly skipped with Dennis's approval; real loopback POST happy-path tests remain the successful evidence for current snapshots.
- Synthetic-only browser QA: `1440×900`, `390×844`, `375×844`; backup download, modified import, original restore, nine-screen navigation, reduced motion, theme switching and overflow checks passed, with no uncaught page errors. QA uses a disposable browser and ephemeral server, not the active installation.
- No visual component, theme, brand or design token changed.
- The automated staged security scanner was blocked by the tool safety gate; Dennis explicitly approved skipping that scanner in favor of independent read-only code review before publication.
- `npm ci` encountered an `ENOTEMPTY` directory error in the disposable clone; `npm install` completed with no manifest/lockfile changes. No active installation dependencies were touched.

## Remaining blockers / decisions

- PR #9 is still an unmerged dependency. AERION Main must accept/reconcile its baseline before integrating this stacked PR.
- The canonical tree's case-colliding architecture documents remain a separate preservation task; no blind Mac fast-forward.
- Missing historical per-field observation times cannot be recovered from an old aggregate date. They remain legacy/unknown, not invented.
- This change improves provenance and unavailable states; it does not change stale-data prescription algorithms. Existing pure coaching engines may still calculate recommendations from stale supplied values; the browser-snapshot API now withholds these unsupported outputs. Changing internal prescriptions or remaining non-API consumers requires separate approval.
- The current freshness report and coaching-provenance UI use different pre-existing age thresholds (aging at two days/stale at seven versus provenance stale at two). Threshold harmonization is not silently introduced here.
- Distinct manual-versus-synced semantic matches remain separate by the existing policy; deciding when they represent the same completed session requires explicit identity/provenance requirements.
- Restoring over protected future-schema/corrupt storage is intentionally not an automatic destructive repair. A separate explicit recovery/export workflow is needed for those installations.
- SQLite is still an external executable rather than an installed project dependency. CI/runtime provisioning must include it.
- The existing `npm run typecheck` covers `src/`, not server/scripts; these new boundaries are exercised by runtime HTTP/client tests. A dedicated server/scripts TypeScript gate and explicit Node typings remain build-tooling follow-up work; the app typecheck passing must not be described as a full-repository typecheck.
- Dependency audit found existing vulnerabilities: `npm audit --omit=dev` reports four high-severity packages (`vite`, `postcss`, `nanoid`, `source-map-js`). No unrelated dependency upgrade or forced audit fix was applied.
- No deployment, branch promotion, active-installation update, private-data upload, or new scheduling/strength/coaching policy is included.
