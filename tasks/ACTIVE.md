# AERION-002 — Real-state bootstrap and activity identity guardrails

Status: recommended next safe product task  
Owner: Work · Executor: Codex  
Base branch: `refactor/v2-foundation`  
Task branch: `codex/aerion-002-real-state-guardrails`

## Goal

Prevent repository fixtures and manual defaults from silently becoming athlete truth, and make activity identity/provenance deterministic before adding more coaching intelligence.

## Why now

AERION-001 confirmed that fresh/reset state can load historical April 2026 fixtures, including a hardcoded manual placeholder activity and stale recovery/race context. It also confirmed that manual activities bypass the shared synced-activity dedupe map.

## Scope

1. Separate demo/fixture bootstrap from live athlete state.
2. Prevent `manual-20260430-sort-like-activity` from entering live coaching state.
3. Make manual-vs-synced duplicate policy explicit and covered by tests.
4. Preserve Intervals.icu sync, Garmin/Strava adapter contracts, local persistence and backup import/export.
5. Add provenance/fixture guards at the data/state layer before UI changes.

## Acceptance

- [ ] Fixture/default records are explicitly marked and excluded from live coaching authority once real evidence exists.
- [ ] Fresh/reset live state cannot silently inherit stale April 2026 recovery/race truth.
- [ ] Manual-vs-synced duplicate behaviour is deterministic and tested.
- [ ] Existing local data is never reset or silently rewritten.
- [ ] `npm test`, `npm run typecheck`, and `npm run build` pass, or exact limitations are recorded.
- [ ] No UI redesign, backend migration, branch promotion or coaching-rule change.

## Preservation gate

Do not reset, clean or overwrite Dennis's Mac checkout. If local files overlap this task, stop and compare before applying changes.
