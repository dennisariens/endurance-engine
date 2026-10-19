# Codex to Work — Issue #17

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
