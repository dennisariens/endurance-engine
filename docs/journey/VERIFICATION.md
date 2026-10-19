# Issue #20 verification — 19 October 2026

**Verified implementation SHA:** `1600c4e03fdd6966067f6b6289a00923b44f6e48`.
Evidence-only follow-up contains this report and synthetic captures.

Node 24.13.1; PostgreSQL 18.1; Playwright Chromium 145.0.7632.6. Compiled Express
`app.cjs`, disposable real PG, local TLS proxy, actual Secure/HttpOnly/Strict cookies.
No public-source fixture masquerades as the authenticated backend.

| Executed check | Result |
| --- | --- |
| `npm ci` | PASS; lockfile/dependencies unchanged |
| `npm run test:personal:pg` | 392 tests / 66 files PASS; **zero skipped** |
| `npm run typecheck`, `npm run typecheck:server` | PASS |
| `npm run build`, `npm run build:server` | PASS |
| `npm run qa:journey` | PASS against compiled Express + real PG |
| Six arrivals × forward/reverse × desktop/mobile | 24 crossings PASS; one arrival each, matching panel/head, pulses end ≤1.1s |
| Four goals × five scenarios × seven plan days | 140 cases PASS |
| Four goals × five scenarios × four performance tabs | 80 cases PASS |
| 1440, 1280, 768, 390, 375 layouts | No horizontal overflow or waypoint/copy/panel collisions |
| Mobile demo controls / menu / waypoints | At least 44×44px |
| Keyboard skip-link, menu Escape/focus, pressed/current semantics | PASS |
| Reduced motion | All panels readable; no ring/detour animation |
| 200% layout reflow equivalent | 720×500 CSS viewport PASS; physical browser-UI zoom unverified |
| Login without JavaScript; `/app` refresh / deep links | PASS |
| Public console/page errors, CSP violations, API requests | Zero |
| Personal Beta browser regression | All 15 scenario groups PASS |
| Private compiled JS/CSS comparison with PR #19 | Three assets byte-identical |

Personal Beta checks include login/load gate, no defaults upload, backup preview and
explicit import, desktop/mobile goal/recovery sync, CAS conflict and preserved edits,
uncertain-commit retry with one revision, session expiry and reauthentication, logout,
CSRF/origin rejection, duplicate-activity rejection without inflated load, canonical
export, true provider-unavailable handling, actual PG stop/start persistence, and
signed-in public navigation with no state/API access or mutation. Full PG suite also
verifies encrypted administrative backups, before-image restore and persisted original
idempotency responses. Personal Beta source/coaching/schema unchanged.

## Artifacts

- [All Journey machine results / arrival events](qa/results.json)
- [Personal Beta machine results](qa/personal-beta-results.json)
- [Command summary / versions](qa/verification.json)
- [Unchanged private asset hashes](qa/app-assets.json)
- [Short scroll recording — WebM](qa/journey-scroll.webm)
- Desktop: [hero](qa/hero-1440.png), [Proof](qa/proof-1440.png), [closing](qa/closing-1440.png)
- Mobile: [hero](qa/hero-390.png), [Proof](qa/proof-390.png), [long view](qa/long-view-390.png), [closing](qa/closing-390.png)
- Additional 1280/768/375 captures and reduced-motion/zoom-equivalent captures are
  alongside these files. Screenshots and recording contain illustrative data only.
- Private regression: [desktop](qa/personal-beta-desktop.png), [mobile](qa/personal-beta-mobile.png).

## Actual scroll measurements

A 6.5-second continuous six-stage scroll at 1440×900 measured 284 frame intervals:
median **16.7ms**, p95 **33.4ms**, maximum **50.1ms**, zero observed long JS tasks.
The initial repaired controller with inherited vector/filter paint measured median
50ms, p95 66.7ms. A targeted cumulative paint experiment found 50ms median with
inherited effects, 33.3ms without SVG filters, and 16.7ms without dense topography.
Rather than removing the approved artwork, the final implementation uses the same
contours with their fade baked into a cached raster and removes route glow filters.

These are actual local headless Chromium measurements on this Mac, **not** a
sustained 60-FPS guarantee, Lighthouse score, physical iPhone measurement, LCP/CLS
certification, or production network measurement. `AERION_QA_JOURNEY_PROFILE=1`
with the same harness reproduces the targeted cumulative effect comparison.

## Reproduce without owner data

```sh
npm ci
npm run typecheck
npm run typecheck:server
npm run build
npm run build:server
export AERION_PG_BIN=/path/to/postgresql/bin
export AERION_PG_SHARE=/path/to/postgresql/share/postgresql
npm run test:personal:pg
npm run qa:journey
```

Install Playwright Chromium if absent. The harness creates and cleans its own loopback
cluster/certificate/synthetic owner; it never reads or uses a real `DATABASE_URL` or
Mac athlete records. No insecure-cookie or production origin relaxation. Artifacts
are written under ignored `artifacts/journey` and copied here after a successful run.

## Remaining gates / limits

Physical iPhone Safari, VoiceOver, browser-UI 200% zoom, physical-device touch/frame
performance, LCP/CLS and real hosting/HTTPS/proxy acceptance are **UNVERIFIED**.
Inherited #19 advisory, hosting and owner-approval gates remain. Live Intervals
 ingestion is separate Hermes #18 work; the existing 503 is not presented as sync
success. Main readiness confirmation must precede Design signoff; Hermes independent
read-only review is not claimed here. No release approval, deployment, merge,
provisioning, personal data changes or migration performed.
