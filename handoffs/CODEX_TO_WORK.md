# Codex → Work

Task: AERION-001  
Status: not started  
Base: `01db3bf5dc4d2c9cdf0dd9a82d98939cfdd2d315`  
Result commit: pending  
Changed files: none  
Checks run: none  
Mac working-tree inventory: pending  
Remote/local comparison: pending  
Architecture/data findings: pending  
Limitations: pending  
Recommended next task: pending  
Deployment: none

## V3 P2 implementation — 16 October 2026

The earlier AERION-001 placeholder above is historical. P0 is accepted in #4.
Implementation now exists on `codex/aerion-v3-home`, based on
`56ddc1d107b40f2bd880decae3a6264bbcd00717`; this delivery's commit and full file
diff are recorded in the linked draft PR and issue #6 execution update.

Changed: application shell, Home, Training, brand/favicon assets, chart adapters,
briefing snapshot boundary, recovery conflict handling, selected-goal backups,
synthetic regression tests and browser QA runner. Typecheck/build pass;
176 tests pass and four fail because sqlite3 is absent. Eight HTTP checks pass.

Read `AERION_V3_P2_IMPLEMENTATION.md` for evidence and discrepancies. Visual
screenshots/comparison, browser interactions, per-field recovery freshness and
external briefing-client migration remain open. No deployment, merge, Mac app
replacement or Electron packaging change. Next: isolated runtime visual QA and
resolution of the listed provenance gaps before owner acceptance.


## AERION Personal Beta client — Issue #13, 18 October 2026

Isolated branch `codex/aerion-13-personal-beta`, exact parent PR #12 head
`488062fb706235dd08f18ea4cac8912a01844a5b`. Implementation SHA and final evidence
are recorded in `docs/personal-beta/VERIFICATION.md` and the separate draft PR.
No Hermes server/schema files touched; no canonical promotion, deployment,
provisioning, real migration, domain changes or active Mac replacement.

Client: `src/personal/{api,state,PersonalBeta,personal.css}` adds real server
session/login/logout calls, initial canonical-state gate, explicit CAS saves,
repeatable uncertain-write retries, 409 comparison/export/manual resolution,
reauthentication preserving edits, offline indication, validated empty-server
migration preview and server/pending backups. Existing `App` accepts a state
model; coaching uses server-confirmed evidence. Hosted mode bypasses localStorage,
automatic provider merge, local account toggles, file adapter imports and reset.
Existing AE layout/screens retained; recovery constraints and completed manual
entries can be written from desktop/mobile. Production web defaults hosted;
packaged Mac/local development stays local.

Read `docs/personal-beta/CLIENT_CONTRACT.md` for the explicit API contract Hermes
must reconcile. `scripts/fixtures/personal-api.cjs` is a synthetic test fixture,
not backend delivery. `npm run qa:personal` exercises the client through real
loopback HTTP with disposable browser sessions. Evidence includes migration,
restore, goals/constraints across desktop/mobile sessions, CAS, auth expiry,
offline, uncertain commits, unique ledger count/load and source sync control.

Release gates remain: actual Hermes API integration, PG persistence/restart,
server security and owner isolation, encrypted backup restore, live Intervals
ledger/dedupe, HTTPS/Namecheap setup, physical iPhone Safari off home Wi-Fi and
second real host. Original Mac checkout changes and case-colliding architecture
files are excluded. No private athlete data, credentials or live screenshots.
