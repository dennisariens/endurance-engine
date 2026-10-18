# Personal Sync backend — delivery and Namecheap requirements

Draft implementation for Issue #13's execution correction. Based exactly on PR #12
`488062fb706235dd08f18ea4cac8912a01844a5b`. Codex PR #15 remains separate and unchanged.
This is **not a deployment or release certification**. Only synthetic local databases,
records and temporary encrypted files were used. No account/provider provisioning,
paid resources, live Intervals calls, real-data migration, merge or Mac app replacement.

## Implemented boundary

- Node 24 production entrypoint `app.cjs` loads compiled `dist-server/start.mjs`.
  Express 5, Helmet, bcryptjs and node-postgres; no Vite middleware in production.
- One configured owner, no signup or request-selected owner ID. Random 256-bit opaque
  cookies, SHA-256 token hashes in PG, anonymous/login CSRF, rotated login session,
  absolute expiry, server-side logout. Secure / HttpOnly / SameSite=Strict / Path=/,
  `__Host-` cookie, no Domain. Browser storage/URLs never hold session credentials.
- Exact configured HTTPS origin and Host; foreign Origin / cross-site reads and writes
  rejected, writes require Origin. HTTPS forwarding trusted only from configured proxy
  networks; malformed scheme/forwarded host rejected. No CORS permission headers.
- Private API responses no-store; JSON max 5 MiB, compressed requests rejected,
  production request/header timeouts, sanitized bounded errors, process-local login
  and challenge rate limits. Provider credentials are not accepted or returned.
- PG owner state, session and request tables; explicit schema v1 initialization only.
  Owner-row lock serializes competing writers, CAS, increment and response record in
  one transaction. Original committed result replayed before CAS on identical retries,
  even after later revisions/reconnect/restart. Changed payload/reused ID => 409.
- Existing complete V3 snapshot validator reused before state commits. Source evidence
  timestamps are not refreshed by save/import/restore. No fixture, readiness or activity
  defaults are synthesized. Exact same date/type/duration/distance activity candidates
  within one snapshot are rejected for owner review instead of double-counting. This is
  conservative rejection, **not** a full provider identity/dedupe/quarantine ledger.
- Protected CLI: validated V3 preview (field names/counts only), explicit empty import,
  encrypted canonical backup and explicit CAS restore with mandatory encrypted
  pre-restore backup. Restore increments the revision; never rewinds it.
  Preview/import/restore bound normalized canonical snapshots to 5 MiB so accepted
  states remain compatible with the 8 MiB encrypted envelope after base64 expansion.

## Exact PR #15 wire reconciliation

Contract read from `docs/personal-beta/CLIENT_CONTRACT.md` at client head
`c1c98ef974c0db9870c210fe50d146dcf0772164`.

| Route | Backend behavior |
| --- | --- |
| GET `/api/auth/session` | 200 anonymous `{authenticated:false,csrfToken}` or owner `{authenticated:true,csrfToken,owner:{displayName}}`; anonymous session is a real PG session, not authentication |
| POST `/api/auth/login` | JSON `{password}` + anonymous cookie/CSRF/Origin; 204 and rotated cookie on success; wrong password 401 |
| POST `/api/auth/logout` | Authenticated CSRF/Origin; invalidate PG session and expire cookie; 204 |
| GET `/api/state` | `{revision,snapshot,updatedAt}` plus quoted revision ETag; revision 0/null/null when explicitly initialized empty |
| PUT `/api/state` | JSON `{snapshot}`, quoted numeric `If-Match`, UUID `Idempotency-Key`, CSRF/Origin; confirmed canonical envelope; 409 retains remote state; missing/invalid preconditions 428 |
| POST `/api/sync` | Authenticated CSRF/Origin + UUID idempotency header, empty JSON object; **503 `{error:"PROVIDER_UNAVAILABLE"}`**, no state mutation or fake success |

**Deliberate limitations/deviations:** provider sync is unimplemented, as expressly
allowed by the correction; Intervals connector is the next bounded deliverable. No
provider secrets are configured in this PR. Legacy `/api/briefing` and dev sync routes
are not exposed by this production server (401 anonymous, 404 authenticated). Baseline
coaching engines remain client-side and unchanged. Initialization PUT with revision 0
is the explicit owner-confirmed Save/import action from the client contract; no extra
consent header is invented. The server cannot distinguish a manually composed initial
snapshot from an approved backup: preview and owner confirmation live in PR #15/CLI.
Any future separate migration endpoint requires a reconciled contract, not auto-upload.
Activity ambiguity uses 409 `ACTIVITY_REVIEW_REQUIRED`; PR #15 currently treats all
409s as generic revision conflicts, so its combined integration pass must surface the
activity-review distinction rather than imply that reloading a revision solves it.
The production frontend is **not** integrated here. Baseline PR #12 is local-mode:
never point the production static directory at that build. Password input is bounded
to bcrypt's 72 UTF-8 bytes; configure the owner password within that bound.

## Build / startup

On an isolated build host: `npm ci`, `npm run typecheck`, `npm run typecheck:server`,
`npm run build`, `npm run build:server`. Backend output is ignored, reproducible from
source. The backend production runtime requires only its external Express/Helmet/
bcryptjs/pg/rate-limit dependencies; TypeScript/tsx/esbuild are build/test tooling.
`npm run start:server` or Passenger startup file `app.cjs` starts the compiled server.
Missing critical config, owner row/schema or database access refuses startup without
printing config. Startup never runs schema initialization or imports athlete state.

`npm run build` in this branch proves preservation of the baseline; it is **not** the
hosted client artifact. During the commissioned integration pass, build the reconciled
PR #15 hosted client and supply its absolute output directory via `AERION_STATIC_DIR`.
The server serves only `/` and allowlisted `/assets` files, no repo/dotfiles/source maps.
Without a static directory, `/` responds 503 `HOSTED_CLIENT_REQUIRED`, not a local-mode
app. Alternative: configure cPanel/Apache to serve **only that hosted client's build**
at `/` and `/assets`, reverse-proxy **all `/api`** to this private backend under the
same origin. Never expose app root/config/backups as the document root.

### Configuration matrix — names only; never put values in GitHub

| Variable | Purpose / owner action |
| --- | --- |
| `NODE_ENV` | cPanel production mode |
| `AERION_ORIGIN` | Exact public HTTPS origin, no subpath/query/userinfo |
| `AERION_OWNER_ID` | Owner-generated UUID, stable across restarts; never client-selected |
| `AERION_OWNER_DISPLAY_NAME` | Owner display label, bounded length |
| `AERION_PASSWORD_HASH` | Owner-generated bcrypt hash, cost 10–14; no plaintext password or hash in repo/logs |
| `DATABASE_URL` | Dedicated private PG database/role; verified TLS for remote PG, never disable certificate verification |
| `AERION_TRUST_PROXY` | Only verified immediate proxy IPs/CIDRs or loopback; absent = no forwarding trust; never universal trust |
| `AERION_SESSION_HOURS` | Optional absolute session expiry, bounded 1–24 hours |
| `AERION_STATIC_DIR` | Optional absolute reconciled **hosted-mode** build directory, never repo/private data root |
| `AERION_BACKUP_KEY` | Admin-only exact 32 random bytes, canonical base64; keep separately from encrypted backups and out of web-worker config |
| `PORT` | Private listener port supplied/handled by hosting runtime; verify Passenger interception |
| `AERION_TEST_DATABASE_URL` | Test-only explicit disposable loopback DB named `aerion_test` with optional suffix; never production |
| `AERION_PG_BIN` | Test-only local PostgreSQL binary directory; otherwise binaries from PATH |
| `AERION_PG_SHARE` | Optional test-only initdb support directory |

Store protected environment/config outside webroot with owner-only permissions.
Do not load or copy the active Mac `.env.local`. Do not prefix secrets with `VITE_`.
No database endpoint is reachable from the browser. Use a dedicated app role/database;
no superuser, no unrelated database access. Runtime needs SELECT/INSERT/UPDATE/DELETE
on the three owner tables and SELECT on schema version, not schema DDL. Run schema
with a separate provisioning role and grant only required runtime privileges afterward.
All SQL uses owner predicates and parameters; owner-isolation tests are executable.
This PR claims server authorization, **not RLS** or protection against a stolen DB role.

## Explicit schema, migration, backup and rollback

Commands below are documentation only, **not executed against Namecheap or live data**.
Supply private environment through an owner-controlled process configuration first.

1. `npm run admin:server -- schema --confirm-schema` initializes v1 and an empty owner
   row idempotently. It never imports anything and rejects an unsupported schema version.
2. `npm run admin:server -- preview /absolute/private/backup.json` validates an existing
   V3 backup and prints only fixed field names/counts. Preserve the original backup.
3. After owner review only: `npm run admin:server -- import-empty /absolute/private/backup.json --confirm-empty`.
   Refuses populated state, transactional CAS revision 0; no automatic browser upload.
   The PR #15 UI provides the corresponding explicit file/preview/confirmation flow.
4. `npm run admin:server -- backup /absolute/private/new-file.enc` writes AES-256-GCM,
   random 96-bit IV, authenticated owner/version metadata, exclusive create, mode 0600,
   fsync. Refuses paths within repo/static/public directories. Keep an off-host encrypted
   copy plus separate protected key. The web API never receives the backup key.
5. To restore populated state, stop/review pending owner edits first, read current revision,
   then `npm run admin:server -- restore /absolute/private/approved.enc --confirm-restore --revision N --backup-before /absolute/private/new-before.enc`.
   Same-owner authenticated decrypt, snapshot validation, mandatory private encrypted
   before-image, CAS and monotonic revision. A race fails rather than overwriting a
   newer save. Retry requires a fresh revision, review and a new backup filename.
6. Roll back application code only to a schema-compatible **hosted/authenticated** version,
   never blindly revert to the local PR #12 build. Keep canonical DB and revision history.
   State rollback is another explicit restore. Do not drop the schema to downgrade.
   On password compromise revoke all owner sessions through protected database admin;
   changing the password hash alone does not invalidate existing unexpired sessions.

Backups are canonical-state backups, **not** a full database/session/forensic archive.
Idempotency responses are retained indefinitely for reliable uncertain retries and
contain historical snapshots: provision disk accordingly and set an owner-approved
retention policy before longer-term use. Expired sessions are denied but require
operational cleanup. Backup-key loss makes encrypted recovery impossible. Authentication
limits are process-local and reset on restart: verify proxy-wide throttling before use.

## Actual verification

- Real PostgreSQL 18.4, Node 24.13.1, disposable loopback cluster, default durable PG
  settings; test driver creates and removes its own temporary cluster, never uses
  `DATABASE_URL` or the owner's existing PG service.
- `npm run test:personal:pg` with `AERION_PG_BIN` pointing to an available local binary:
  **386 tests / 65 files PASS, zero skipped**. Includes real HTTP + PG login, two sessions,
  simultaneous CAS (one 200/one 409), private owner separation, persisted original retry,
  source timestamps, malformed/no-data/stale baseline coverage and bounded errors.
- Driver additionally stops and starts the actual PG process: canonical state, exact
  idempotent result and authenticated session survive. Compiled `app.cjs` login/read
  against PG passes. Compiled admin schema/encrypted backup/restore/backup-before with
  monotonic revisions passes. Temporary synthetic databases and files removed.
- Without a test DB configured, ordinary `npm test -- --maxWorkers=2` explicitly
  skips the 12 PG integration tests; **not** PG evidence on its own.
- `npm run typecheck`, `npm run typecheck:server`, `npm run build`, `npm run build:server`
  pass. Production launch without config fails closed with a generic message.
- `npm audit --omit=dev` reports four inherited high findings in Vite/build dependencies
  (`vite`, `postcss`, `nanoid`, `source-map-js`), not in the added backend runtime packages.
  No broad baseline dependency upgrade included. Do not run a Vite server in production;
  dependency remediation remains a release gate, not a clean-audit claim.
- No UI files changed. No new browser visual acceptance claim; PR #15 combined browser
  work, real HTTPS and physical iPhone Safari are **not** established by Node HTTP tests.
- Independent review found two logic defects before commit: error classification and
  a large admin import that could not fit the encrypted backup envelope. Targeted
  regressions now verify explicit activity-review codes, sanitized persistence 503s,
  suppressed unknown codes, rejected oversized canonical imports/restores and a
  near-limit import that can be encrypted. The final full-PG run above includes these.

## Namecheap acceptance gates — not yet performed

Owner-approved target is existing Stellar Plus / separate AERION subdomain and app root.
cPanel reportedly offers Node 24.21.0 and PostgreSQL; this code was tested locally,
**not** on that runtime. SSL remains unverified/pending per Main; do not deploy now.
Before any future approved deployment, verify only these focused gates:

1. Active valid HTTPS certificate and intended DNS; preserve existing ColdDesert domain,
   document root, routing and renewal. Owner approves privacy/data residency/costs.
2. Actual PG supported version, JSONB/row-lock/transaction capabilities, private network
   or verified TLS, dedicated roles/grants, disk quotas, encrypted off-host backup and
   tested restore. No production schema or data migrations without separate approval.
3. Passenger startup `app.cjs`, compiled files present, Node version, ESM loading,
   loopback/port interception, process restarts and bounded connection/process quotas.
   The default backend pool is four connections **per process**; confirm hosting limits.
4. Verify proxy overwrites forwarding headers, preserves intended Host and HTTPS scheme,
   never allows direct public backend access; configure precise trust, no security bypass.
   Check Secure cookies, SameSite, Origin on real iPhone; do not relax to HTTP.
5. Configure proxy-wide rate/request/header/body limits and no response/body/credential
   logging or caching of private `/api`. Confirm 5 MiB body allowance under hosting limits.
6. One commissioned integration of this PR with #15: real hosted-mode client using actual
   HTTP+PG backend, two desktop sessions and physical Safari iPhone off home Wi-Fi;
   same revisions after refresh, edit preservation on 409/expiry/offline, no default
   overwrite, explicit import and encrypted restore; no unsupported readiness or load.
7. Add the real Intervals provider connector separately; `/api/sync` remains explicitly
   unavailable until normalized, canonical, idempotent and ambiguity-safe ingestion exists.

No release readiness is claimed until these gates and explicit owner deployment approval.
