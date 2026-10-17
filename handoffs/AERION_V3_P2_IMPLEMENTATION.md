# AERION V3 implementation checkpoint — 16 October 2026

**Browser follow-up:** the screenshot/runtime blocker described below is now
resolved locally. See `docs/qa/v3-review/README.md`, screenshots, results.json
and comparison.html. The new self-contained browser runner passed all three
viewports, navigation/theme/Why, mobile dialog focus, and actual synthetic backup
download/import/restore. Historical limitations below remain for chronology;
data provenance, external integration and SQLite gates are still open.

Branch: `codex/aerion-v3-home`. Base: `56ddc1d107b40f2bd880decae3a6264bbcd00717`. Target: `refactor/v2-foundation`.

Actual React application changes are implemented, not a concept render. This is a draft review checkpoint; visual acceptance is incomplete. No merge, deployment, native installation, private athlete-data changes or Electron configuration changes were performed.

## Implemented

- Approved AE asset in the application shell, canonical favicon, dark/light tokens, compact navigation, native modal More navigation, keyboard focus and reduced-motion CSS.
- Home with one recommendation, Why, adaptive 72h engine output, current goal and observed evidence. Missing/stale/conflicting recovery evidence is disclosed; absent evidence cannot generate a made-up readiness score. Existing injury/illness restrictions remain visible.
- Bounded Training session presentation using the existing recommendation engine.
- Unsupported illustrative histories now display unavailable states. Activity-derived series preserve zero and missing-value gaps.
- First-run/reset state no longer silently seeds bundled athlete fixtures. Existing local storage is retained. Backup snapshot carries selected goal.
- Older/same-date conflicting recovery sync preserves local values and reports conflicts. Browser/server orchestration parity tests include goal selection and decision history.
- `/api/briefing` requires an explicit browser snapshot via POST. GET returns 409 with an unavailable explanation; it does not fall back to fixtures. In-app advice continues to derive directly from browser state. External GET clients must migrate before integration; the Mac runtime has not been changed.

## Verification

- `npm run typecheck`: PASS.
- `npm run build`: PASS.
- `npm test`: 176 passed, 4 failed, 180 total across 55 files. All four failures are `spawnSync sqlite3 ENOENT` (three evidence-store tests, one API persistence test). Unchanged baseline independently reproduced 160 passed / 4 failed. No failing tests were removed or skipped.
- Synthetic backup tests verify export callback, serialized contents, import/restore callback, zero preservation and rejection of unsupported versions. This does not establish an actual browser download or complete UI restore.
- HTTP runtime checks in an isolated Vite process: application and both favicons 200; snapshot-free briefing 409; synthetic empty snapshot 200 with missing provenance; malformed JSON 400; unsupported method 405; cross-origin POST 403.
- Exact logo SHA-256: `2e8faad9371181587a42c02b8d5fcf924f60fa0b5c45ce9e738be46270c476d3`, matches approved PR #2 source. Favicon ICO SHA-256: `9c9f0c4c823d50664d0587eaa3b39adf1c8acfd3f60ad52645f6d6ef07d7d308`.

## Discrepancies and remaining gates

| Requirement | Actual evidence | Remaining action |
| --- | --- | --- |
| Real desktop/mobile/light screenshots and before/after | Not captured | Local Playwright browser absent; official download returned an invalid archive. Cloud browser could not reach the isolated localhost server. Connected browser reports missing originating context. Run isolated synthetic browser QA on an available host. |
| Navigation, keyboard, theme, 375px overflow, reduced motion | Implemented and source-reviewed; no browser verification | Run `scripts/qa-v3.cjs` plus interaction checks before owner review. |
| Per-field recovery freshness | Existing schema supplies a shared state timestamp, not per-field timestamps | Retained values may be older than a subsequent sync timestamp. Add field-level observation provenance before claiming complete live-data integrity. |
| Conflict resolution | Values retained, conflict disclosed | Equal-date conflicts require explicit source review; no dedicated resolution UI yet. |
| Legacy fixture provenance | New seed removed, prior local values retained | Existing persisted records cannot be retrospectively certified as measured; do not erase them automatically. |
| External briefing consumers | GET now honestly unavailable | Hermes snapshot migration required before integration. |
| SQLite | Four environment failures retained | Run unchanged tests on a host with sqlite3. |
| Electron and live integrations | Configuration preserved; no packaging/live-auth test | Separate protected Mac runtime verification, without replacing active installation. |

## Reproduction

Use a separate checkout/worktree of this branch. Install locked dependencies there, then run `npm run dev` (5174 default; choose an unused port if the existing app occupies it). Do not reuse the live browser profile or private backups for QA.

`scripts/qa-v3.cjs` requires Playwright and its Chromium browser on the QA host. It creates new disposable contexts, blocks live sync, seeds synthetic empty state and checks 1440×900, 390×844 and 375×844 with dark/light captures. Set `AERION_QA_URL` for the isolated server and `AERION_QA_OUTPUT` for screenshots. The runner is provided but has not completed in this environment.

Before/after source comparison: original oversized duplicated hero and top navigation are replaced by one bounded recommendation and responsive navigation; original fabricated chart histories are replaced by unavailable states. This statement is source-backed, not a substitute for rendered comparisons.

Owner approval is still required before merge, install or deployment. This checkpoint is not yet the requested visually verified FIRST WORKING PREVIEW.
