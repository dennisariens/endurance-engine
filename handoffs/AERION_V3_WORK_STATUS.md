# AERION V3 — Work intake and first delivery

Date: 2026-10-16. Parent #3; planning PR #7; Work #5; Hermes #4; Codex #6.

## Verified

- Product remote: 56ddc1d107b40f2bd880decae3a6264bbcd00717.
- Planning: 82e93d8c8c0d596aac1b7d60d2bcf7135f2d1fd6; all three requested documents read.
- Approved brand: 78bfed9821f3b04941f945cf805b251a52303a39, PR #2 still open/unmerged; 37 manifest entries checked, no hash mismatch.
- Existing shell, Home, Training, typed props, derived freshness, sync types and shared UI inspected.

## Delivered in this branch

`docs/design/AERION_V3_WORK_CONTRACT.md`: desktop/mobile Home and Training layout, before/after specification, actual reuse map, source/data truth rules, bounded asset integration, component interactions and P2 verification matrix.

`docs/design/AERION_V3_TOKENS.json`: dark/light tokens and sizing specification, not application configuration.

`docs/design/AERION_V3_CONTRAST_CHECK.json`: 38 opaque text/background pairs verified at >=4.5:1 (minimum 4.94:1). This is token-level validation; runtime CSS and non-text controls still require visual/accessibility checks.

No executable source files changed. The 16–64 px export proof was reviewed; 16 px gaps are marginal and actual-device validation is still open.

## Blockers and ownership

1. Hermes / #4: no acknowledged Mac inventory, source delta, private runtime screenshots or safe-preservation evidence received. Task request posted. This session has no direct Hermes/Mac execution connection, so posting the issue is not proof of agent execution.
2. Work: cannot declare the implementation base safe until that report is reviewed. P1 specification is prepared, but actual Home V3 screenshots and before/after runtime comparison cannot be produced before P2 is released.
3. Verification environment: previous product gate had four sqlite3 ENOENT test failures; do not label full tests passing. Hermes should verify native SQLite availability; no new application test run is claimed for this docs-only change.

## Findings for P2

The 72 fallback is real. Additional cross-domain substitutions exist: Home goal readiness falls back to readyScore; history load uses stats.avgRaceCost || readyScore. Goal readiness and daily recovery must be separated; valid zero preserved; source observation date must not be replaced by fresh sync time. Full details are in the design contract.

## Next action

Await public-safe P0 report on #4 and private screenshots through an approved channel. Work reviews local-only source and preservation plan, then posts exact base/contract/brand SHAs and allowed paths on #6 before commissioning Codex. No new permission request for already-authorized development. No merge/install/deployment.

## Deliverable state

Runnable Home V3: pending P0/P2. Desktop/mobile/light screenshots: pending. Before/after runtime comparison: pending. Design discrepancy specification: delivered; runtime discrepancy report pending. App tests: previous baseline results only. Main updated through #3.
