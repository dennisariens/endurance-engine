# AERION-001 — Baseline and source reconciliation audit

Status: completed with Mac reconciliation evidence
Completed: 2026-10-15
Owner: Work · Executor: Codex  
Base branch: `refactor/v2-foundation`  
Verified base commit: `01db3bf5dc4d2c9cdf0dd9a82d98939cfdd2d315`  
Audit branch: `codex/aerion-001-baseline-audit`

## Outcome

The remote product baseline is established and audited. `refactor/v2-foundation` remains the product authority. `main` remains an unrelated minimal placeholder and must not be promoted/merged yet.

Mac reconciliation confirmed a clean checkout at the requested baseline, one workflow/documentation commit behind the remote product branch, with no tracked modifications, non-ignored untracked files, stashes or local-only commits. Ignored local data remains preserved and uninspected. No destructive action or branch promotion was performed.

Full evidence: `docs/AERION-001-AUDIT.md`.

## Acceptance

- [x] Repository, product branch and exact remote base SHA recorded.
- [x] Mac branch, HEAD, status, untracked state, stash and local-only commits inventoried without changing user work.
- [x] Remote/local differences classified: code-identical; local checkout behind one remote documentation commit.
- [x] Verification rerun: 164/164 tests, typecheck and build passed.
- [x] Primary UI/data-source status audited from source and desktop/mobile runtime captures.
- [x] Known architecture/data risks confirmed, narrowed or disproved.
- [x] macOS case-collision risk in remote documentation identified and preserved for explicit resolution.
- [x] Safe canonical-branch plan and bounded next task documented.

## Canonical plan

Keep `refactor/v2-foundation` as product authority. Leave `main` untouched until explicit approval to preserve refs, archive the unrelated placeholder and switch/rename the default branch without merging unrelated histories or force-pushing.

## Exclusions preserved

No destructive Git operation, data reset, secrets exposure, redesign, backend migration, branch promotion, merge to `main`, deployment or new coaching rule.
