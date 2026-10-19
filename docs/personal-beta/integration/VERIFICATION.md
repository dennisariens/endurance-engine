# Issue #17 combined integration

Synthetic-only verification on 19 October 2026, Node 24.13.1, PostgreSQL 18.1,
Chromium 146.0.7680.153. No deployment, merge, athlete migration or live provider calls.

Inputs: client #15 `c1c98ef974c0db9870c210fe50d146dcf0772164` and backend #16
`7a195b100cf12cbda3d481703c536aef874a2db2`. Integration branch:
`codex/aerion-17-integration`, PR base `codex/aerion-13-personal-beta`.

## Executed checks

- `npm ci`: pass, reproducible backend lockfile with combined package scripts.
- `npm run test:personal:pg`: **391 tests / 66 files passed, zero skipped**.
  This runs the full unit/HTTP/PG suite, actual PostgreSQL stop/start, persisted
  session/idempotent replay, compiled admin encrypted backup/restore with mandatory
  before-image, and compiled startup/login. Ordinary `npm test` without the disposable
  database would skip PG cases and is not the evidence used here.
- `npm run typecheck`, `npm run typecheck:server`, `npm run build`,
  `npm run build:server`: pass.
- `npm run qa:personal:integrated`: compiled `app.cjs` and actual PostgreSQL,
  local TLS reverse proxy, independent desktop 1440/1280 and mobile 390 contexts.
  See [machine results](results.json) for the 14 scenario groups. No page errors;
  desktop/mobile screenshots await loaded screens and assert no horizontal overflow.
- [Desktop](desktop.png) and [mobile](mobile.png): synthetic canonical data only.

Browser traffic uses HTTPS, actual `__Host-` Secure/HttpOnly/Strict cookies, exact
origin/host and a loopback-only trusted proxy. The self-signed certificate is trusted
only by disposable test browser contexts. No backend security relaxation. Corrupting
one successful commit response at the proxy simulates uncertain delivery; retry
returns the durable original result without an additional revision. PG session expiry
is induced only inside the disposable cluster. PG is actually stopped and restarted.

## Corrections

Combined package scripts preserve both client and backend commands. Client API errors
allowlist machine codes, distinguish activity review from CAS revision conflicts,
and accurately report unavailable ingestion. Rejected activities retain pending edits
without opening misleading revision retry; refresh/export allows explicit recovery.
The pre-existing briefing backup test now specifies its intended evidence date,
avoiding wall-clock-dependent stale-evidence failure. Server contracts are unchanged.

## Reproduce

Use Node 24 and local PostgreSQL binaries; no external database or owner configuration.

```sh
npm ci
npm run typecheck
npm run typecheck:server
npm run build
npm run build:server
# Set these to disposable-compatible local PostgreSQL executables/schema resources:
export AERION_PG_BIN=/path/to/postgresql/bin
export AERION_PG_SHARE=/path/to/postgresql/share/postgresql
npm run test:personal:pg
# Install Chromium separately if absent, or set AERION_CHROME to its executable.
npm run qa:personal:integrated
```

Production build must use the hosted client (default production mode). Do not set
`VITE_AERION_MODE=local`; explicitly use `VITE_AERION_MODE=hosted npm run build`
when preparing hosted artifacts. Supply absolute `AERION_STATIC_DIR` pointing to
that compiled `dist`, never the repository or the PR #12 local-mode artifact.
Electron/local mode and the active Mac checkout remain separate.

## Dependency/security assessment

`npm audit --omit=dev` reports four inherited high packages: Vite 8.0.10,
PostCSS, nanoid and source-map-js. Advisories concern Vite development endpoints
(Windows path/editor handling), CSS/source-map processing and nonsecure generator
inputs. Compiled Express imports only its external runtime packages and bundled
server validation; it does not import or run Vite, PostCSS, nanoid or source-map-js.
These build tools do not process browser-supplied snapshots in the hosted backend.
No finding is reported in the added Express/PG/auth runtime packages. No broad
updates were applied; inherited build-tool findings remain a release/toolchain gate.
Do not expose the Vite server or build untrusted CSS/source maps. This is not a
clean-audit claim. Other inherited development dependencies also have audit findings.

## Remaining release gates

Actual Namecheap HTTPS/Passenger, trusted proxy configuration, private PostgreSQL,
backup retention/off-host controls, physical Safari/iPhone off home Wi-Fi and owner
release approval remain unverified. Live Intervals ingestion remains separately owned
by Hermes: `/api/sync` intentionally returns 503, with no fake data/freshness.
No installation, DNS/provisioning, merge, deployment or real data migration performed.
