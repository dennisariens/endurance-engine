# Aerion chat update

Task: AERION-001  
Status: complete with Mac reconciliation evidence
Accepted audit branch: `codex/aerion-001-baseline-audit`

**HR Chest Strap Insights** is the primary Aerion chat and front door.

AERION-001 now includes live Mac evidence. The checkout is clean at `01db3bf5dc4d2c9cdf0dd9a82d98939cfdd2d315`, one documentation commit behind `origin/refactor/v2-foundation` at `56ddc1d107b40f2bd880decae3a6264bbcd00717`; there are no non-ignored untracked files, stashes or local-only commits. All 164 tests, typecheck and build pass. Desktop/mobile QA confirmed stale fixture mission state, desktop hero collisions and mobile horizontal clipping. The remote docs also contain a macOS case collision between `docs/architecture.md` and `docs/ARCHITECTURE.md`, so the Mac checkout must not be blindly fast-forwarded. `refactor/v2-foundation` remains product authority; unrelated `main` stays untouched pending explicit case-resolution and archive/default-branch decisions.

The safest next product task is AERION-002: isolate fixture/default state from live athlete truth and harden activity identity/provenance before adding more coaching intelligence.

Product context recorded only: Tuesday ZRL is no longer fixed before the 15 November marathon; long runs may float with recovery; injury-aware scheduling and progressive home strength are future requirements.
