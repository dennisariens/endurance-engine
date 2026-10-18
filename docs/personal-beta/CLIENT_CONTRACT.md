# AERION Personal Beta — client integration contract

Issue #13, implementation assignment 18 October 2026. Client branch is based on
PR #12 exact head `488062fb706235dd08f18ea4cac8912a01844a5b`.
No server/schema files are changed. This is a reviewable client implementation;
Hermes must reconcile this wire contract with its owner-only Node/PostgreSQL API
before any release. The synthetic fixture is **not a production backend**.

## Mode and transport

Hosted web production is the default. `VITE_AERION_MODE=hosted` enables the same
mode in development. `VITE_AERION_MODE=local` explicitly builds the legacy local
client; packaged Electron `file:` remains local. No secret belongs in VITE_*.
Existing Mac localStorage is neither read nor overwritten in hosted mode.

All API paths are root-relative under `/api` on the current origin. No configurable
external API host. JSON requests use same-origin cookies, no-store, redirect
refusal and a 15-second timeout. No bearer/session tokens in storage or URLs.
Authentication is asserted only by the server, never by imported account fields.
Provider credentials never enter the client contract.

## Wire contract to reconcile with Hermes

| Request | Response / semantics |
| --- | --- |
| GET `/api/auth/session` | Anonymous: 200 `{authenticated:false,csrfToken}`. Owner: 200 `{authenticated:true,csrfToken,owner:{displayName}}`. Anonymous 401 is also handled by initial load, but login requires a 200 anonymous CSRF challenge. |
| POST `/api/auth/login` | `{password}` and `X-CSRF-Token` from anonymous challenge; establishes server cookie; client re-fetches session and canonical state. |
| POST `/api/auth/logout` | CSRF header; invalidates cookie/session server-side. Client clears athlete memory only on successful response. |
| GET `/api/state` | `{revision,snapshot,updatedAt}`. Empty is exactly revision 0, snapshot null, updatedAt null. Existing state uses a positive safe integer revision and validated V3 snapshot. updatedAt is commit time, never substituted for source observedAt. |
| PUT `/api/state` | Body `{snapshot}`, `If-Match: "<revision>"`, `Idempotency-Key: <UUID>`, `X-CSRF-Token`. Transactionally return the confirmed state envelope. Client accepts transformed/deduplicated server state rather than its submitted candidate. |
| POST `/api/sync` | `{}` + CSRF and idempotency headers. Server performs authenticated provider normalization/dedupe; client ignores any raw activity response and GETs canonical state after success. |

Successful mutation may return JSON or 204 (except state PUT, which must return
its canonical envelope). 401 hides athlete UI and preserves pending edits in tab
memory; 409 triggers an independent state GET and explicit comparison; all other
failures preserve drafts. Failed/uncertain PUT freezes further editing and retries
**identical bytes, revision and request ID**. Refresh can recover a committed save
whose response was lost. Reauthentication requires review before resubmission.

Hermes owns Secure/HttpOnly/SameSite cookies, expiry, owner authorization, request
bounds, CSRF verification including login, origin/host/scheme enforcement, CAS
transactions, idempotency durability and payload binding, strict validation,
ledger duplicate quarantine and all PostgreSQL persistence. Client guards are
not authorization. No owner identity is hardcoded. HTTPS/security/PG correctness
is not established by the HTTP fixture.

## User flows

- Load gate: no athlete UI before authenticated state GET. Login never writes
  defaults or uploads localStorage. No automatic provider request/merge.
- Existing approved V3 screens remain. Goals, goal conversations, races and
  visualization edits are pending until explicit Save. Recovery constraints and
  completed manual entries have small controls above the existing shell.
- Training/coaching, readiness, recovery panels and displayed activity ledger
  use the server-confirmed snapshot. Pending activities cannot inflate load.
  Manual entries omit invented load; the server decides acceptance/deduplication.
- Mobile Safari-compatible standard forms and same-origin cookies. No background
  sync claim: refresh the other device after save. No offline write queue.
  Offline/network failure visibly pauses editing; retries remain available when
  the browser reports connectivity. Pending changes are memory-only, exportable,
  with a beforeunload warning. Closing/reloading can lose unexported pending edits.
- 409: retain candidate, fetch remote version, show changed fields/counts and
  expandable complete versions privately. Export pending version, explicitly
  discard for server version, or keep candidate for review and a separate Save
  against the displayed remote revision. A further race produces another 409.
  Full replacement is deliberate, never automatic last-write-wins.
- Source observation timestamps remain unchanged through save, import and sync;
  the shell separately labels server commit time. Existing stale/missing evidence
  qualification remains in the baseline coaching engines.

## Migration, rollback and backup

No automatic migration. Empty server state presents a backup prerequisite,
owner-selected V3 JSON file, existing strict snapshot validation, changed-field
counts, and explicit confirmation. Client file bound is 5 MiB. CAS revision 0 is
the server-enforced empty-state gate; a concurrent initialization produces 409.
The original file stays untouched. Explicit start-empty is an alternative.

Export server backup downloads only the last confirmed canonical snapshot in the
existing V3 format. Pending/conflict exports are separately named. Existing-state
file replacement and reset are intentionally unavailable in hosted UI; rollback
of a populated server requires Hermes' protected restore/backup procedure, which
must be verified during reconciliation. Empty-state restore uses the same preview
flow. Downloaded exports contain private data: keep them in owner-controlled
storage; do not commit them. No real data is included in this branch.

## Verification and release boundary

`npm test -- --maxWorkers=2`, `npm run typecheck`, `npm run build`.
`node scripts/qa-personal-beta.cjs`: disposable Chromium desktop/mobile contexts,
real loopback HTTP cookie/CSRF fixture, canonical state, CAS, idempotency,
backup/restore, expiry, offline and goal/constraint sync. Artifacts under ignored
`artifacts/personal-beta`. `npm run qa:browser` preserves local-mode V3 coverage.

Actual Hermes API compatibility, production Postgres restart durability,
owner/account isolation, real connector/dedupe behavior, encrypted backup restore,
private HTTPS and physical iPhone Safari off home Wi-Fi remain release gates.
The fixture's HTTP cookie deliberately lacks Secure for loopback testing; it must
never be installed on Namecheap. No provisioning, deployment, merge, migration of
real data, native replacement or changes to existing domains are authorized here.
