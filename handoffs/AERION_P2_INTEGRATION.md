# AERION Main — P2 integration candidate

## Storage recovery addendum

Narrow follow-up to PR #12 review `discussion_r4303634965` only.
Verified code: `59f97ada08831b69342ef6f2f113c4b550c2455b`.

Automatic fallback saves still preserve malformed (including empty JSON) and
future-schema bytes. Explicit validated import and confirmed reset now persist
replacement values synchronously, even if React sees an unchanged default and
skips rendering. An absent active-goal selection is removed rather than stored
as an envelope without a value. Unrelated keys remain untouched. All validation
completes before recovery writes. No automatic repair or user-data migration.

Existing local worktrees and the available Hermes handoff were checked before
coding: no reusable local storage-recovery patch was available. The recorded
Hermes local patch concerned the already-fixed API prefix, so no duplicate prefix
change was made.

- Full tests: **337 PASS / 59 files**; typecheck and build PASS.
- `node scripts/qa-storage-recovery.cjs`: PASS in disposable Chromium with
  synthetic data. For malformed JSON and future envelopes across all eleven
  state keys: initial fallback and reload preserve exact bytes; import survives
  reload; confirmed reset survives reload, including unchanged fallback defaults;
  no console/page errors; unrelated key unchanged.
- Results and four captures: `docs/qa/storage-recovery/`.
- Existing nine-screen captures below are historical integration evidence; this
  follow-up ran focused real-browser storage regressions and the full unit suite.

No feature expansion, UI redesign, coaching-rule changes, deployment, canonical
merge or Mac installation. The older storage-recovery limitation below is
superseded for explicit validated import/confirmed reset by this addendum.

## Sources and isolation

- PR #9: `b93ba07d1094d46961bec76d8618f63340a636bd`.
- PR #11: `c7daa8837677eb29688c4afdfb64be870764c11b` (latest head verified before integration and again during review).
- Canonical PR base: `refactor/v2-foundation` at `56ddc1d107b40f2bd880decae3a6264bbcd00717`.
- Candidate: `codex/aerion-p2-integration`, isolated worktree `/private/tmp/aerion-p2-integration`.
- Merge: `bca4c2b`, a normal non-fast-forward merge of #11 into pinned #9; no conflicts or source-branch rewrites.
- Verified implementation and browser runner: `b7fcc6d58831fc8e11ce7460d29d79f8aa417f2b`.

Both pinned heads are ancestors of the candidate. Neither builder branch nor the
canonical branch was merged or rewritten. Original Mac checkout and its user
architecture edits remain untouched. No live data, credentials or active app
installation was copied into this worktree.

## Reviewed discrepancy and fix

Reviewed PR #11's Codex finding at
https://github.com/dennisariens/endurance-engine/pull/11#discussion_r4303537383.

The finding is confirmed: root-relative URL resolution discarded a configured
`/aerion` or nested deployment prefix. Four real-HTTP prefix cases failed before
the fix. The shared CLI/MCP client now treats the validated base pathname as a
directory and resolves `api/briefing` relative to it. Root, trailing slash and
nested-prefix behavior is covered for both GET and POST; subprocess regressions
also exercise CLI and MCP using `AERION_BASE_URL`. Dates and snapshots remain in
the POST body. Existing credential/query/fragment rejection, redirect refusal,
size limits and sanitized errors remain intact.

The fix lives in this integration candidate. Hermes PR #11 and its review thread
are not rewritten or marked resolved on the unmodified source branch.

Integration-only changes beyond the two parents: the shared client URL fix,
seven regression cases, and browser/API verification in `scripts/qa-v3.cjs`.
No visual files or coaching policy changes were introduced by integration.
Hermes changes from #11, including its documented unsupported-reference output
corrections, are retained as delivered.

## Combined verification

- `npm test`: **331 passed, 59 files passed**, including real HTTP, CLI/MCP,
  snapshot validation, field timestamps/conflicts, storage protection and the
  four disposable SQLite-dependent tests.
- `npm run typecheck`: PASS. Existing gate covers `src/`; server/scripts are
  exercised by runtime tests, not a claimed full-repository TypeScript gate.
- `npm run build`: PASS; Vite 8.0.10, 2,368 modules.
- `npm run qa:browser`: desktop 1440×900, mobile 390×844 and 375×844; dark/light,
  nine screens, Home CTA, chart toggles, disclosure, button states, no horizontal
  overflow or console/page errors, mobile Escape/focus return, actual synthetic
  backup download/change-import/restore.
- Combined browser/API flow uses the browser's exported synthetic backup:
  same-origin snapshot POST → 200 / ok / no-store; legacy GET → 409 /
  BROWSER_SNAPSHOT_REQUIRED; missing evidence → 409 / COACHING_EVIDENCE_MISSING;
  cross-origin POST → 403 / SAME_ORIGIN_REQUIRED. Live sync is blocked.
- Snapshot HTTP unit tests also cover malformed records, dates, bounded streamed
  bytes, content types, methods and sanitized internal failures.
- Source-controlled integration patch whitespace check: PASS. The existing
  case-colliding architecture documents remain excluded.

Browser results and actual captures: `docs/qa/p2-integration/`.

## Remaining boundaries

No additional integration blocker was found in the scoped review and combined
checks. Hermes's independent final data re-review remains its separate Main
assignment; this report does not claim that review was completed by Hermes.

Known inherited items remain: different pre-existing freshness thresholds,
non-API consumers calculating from stale supplied inputs, unavailable legacy
observation times, explicit recovery workflow for corrupt/future-schema storage,
manual/synced semantic duplicates, source-label inference, Electron static API
availability and external SQLite provisioning. No internal coaching policy was
changed to resolve these architectural/product decisions.

The repository tracks both `docs/ARCHITECTURE.md` and `docs/architecture.md`.
A fresh macOS worktree therefore shows an architecture-document discrepancy;
those files were neither edited nor staged. Original user edits are preserved.

Synthetic Chromium and local runtime verification do not certify Safari,
native Electron, live providers or private athlete data. Existing dependency
audit findings were not addressed through unrelated upgrades.

No merge into canonical, deployment, packaging or Mac installation was performed.
Routing: AERION Main directly via one integration PR and a link on PR #9.
