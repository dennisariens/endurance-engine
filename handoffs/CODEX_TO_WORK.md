# Codex to Work — Issue #17

Verified implementation merge: `f9e0ee9f863d2ab4884470ba683731c4b81a9bca`.

Combined client #15 c1c98ef974c0db9870c210fe50d146dcf0772164 and backend #16
7a195b100cf12cbda3d481703c536aef874a2db2 in isolated branch
`codex/aerion-17-integration`. Merge commit records both exact parents; integration
follow-ups are in its resulting tree. Active Mac checkout and athlete data untouched.

Changes: combined package scripts/lockfile, distinct activity-review and unavailable
provider client errors, fixed-date inherited test, real Express/PostgreSQL/TLS browser
harness, synthetic captures and verification report. Backend API/security unchanged.

Checks: npm ci; 391/391 tests across 66 files, no skipped PG cases; client/server
typechecks/builds; 14 actual compiled-app Chromium scenario groups with independent
mobile/desktop contexts. Actual PG restart, CAS, persisted idempotency, sessions,
protected encrypted admin backup/restore verified. Full detail and screenshots:
`docs/personal-beta/integration/VERIFICATION.md`, `results.json`, desktop/mobile.png.

Remaining release gates: hosting HTTPS/Passenger/proxy/private PG/backup operations,
physical Safari off home Wi-Fi, inherited build-tool audit findings, owner approval.
Live Intervals ingestion is separate Hermes work; 503 is accurately displayed.
Deployment state: none. No PR merged, no real athlete-data migration or redesign.
Case-colliding docs/ARCHITECTURE.md worktree artifact excluded from staging.

## Issue #20 — approved public Journey

Implementation `1600c4e03fdd6966067f6b6289a00923b44f6e48`, isolated branch
`codex/aerion-20-journey`, based on approved source `254cfcc` / PR #19 `2ac9a8c`.
Public `/`, real private `/app`, API protections retained; private JS/CSS byte-identical.
Files: `public-site/` approved assets + bounded repairs/derived contour cache,
`server/personal/http.ts` static routes, static-boundary tests, build/QA scripts,
`docs/journey/` evidence. No coaching/schema/athlete-state edits.

Checks: npm ci; 392 tests/66 files with real PG and zero skips; both typechecks/builds;
24 waypoint crossings; 140 goal/scenario/day + 80 goal/scenario/metric cases;
five responsive widths, reduced motion, keyboard, no-JS login and strict public/private
isolation; 15 Personal Beta browser scenarios PASS. Median frame 16.7ms, p95 33.4ms
on local Chromium; not physical-device certification. Screenshots + scroll WebM and
remaining gates: `docs/journey/VERIFICATION.md`.

Physical Safari/VoiceOver/actual UI zoom/performance/hosting and independent Hermes
review remain unverified. Await Main readiness before Design signoff. No deployment,
merge, provider calls, Personal Beta branch edits, Mac record changes or migration.
Case-colliding `docs/ARCHITECTURE.md` filesystem artifact remains excluded.
