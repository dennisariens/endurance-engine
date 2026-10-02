# AERION-001 — Baseline and source reconciliation audit

Status: completed with external preservation gate  
Completed: 2026-10-02  
Owner: Work · Executor: Codex  
Base branch: `refactor/v2-foundation`  
Verified base commit: `01db3bf5dc4d2c9cdf0dd9a82d98939cfdd2d315`  
Audit branch: `codex/aerion-001-baseline-audit`

## Outcome

The remote product baseline is established and audited. `refactor/v2-foundation` remains the product authority. `main` remains an unrelated minimal placeholder and must not be promoted/merged yet.

The exact current Mac working-tree inventory cannot be read from the connected GitHub environment and was not durably recorded in the previous local audit. This is treated as a preservation gate, not as evidence that no local-only work exists. No destructive action or branch promotion is authorized until the Mac state is captured.

Full evidence: `docs/AERION-001-AUDIT.md`.

## Acceptance

- [x] Repository, product branch and exact remote base SHA recorded.
- [x] Mac-state limitation explicitly recorded; local-only work protected by preservation gate.
- [x] Remote/local comparison boundary classified: remote source known; current local delta unknown and must not be overwritten.
- [x] Verification history and limitations stated: typecheck/build passed; 160/164 tests passed in prior local audit; four SQLite-backed tests failed on unmanaged `sqlite3`.
- [x] Primary UI/data-source status audited from source.
- [x] Known architecture/data risks confirmed, narrowed or disproved.
- [x] Safe canonical-branch plan and bounded next task documented.

## Canonical plan

Keep `refactor/v2-foundation` as product authority. Leave `main` untouched. Before future promotion, capture Mac branch, HEAD, `git status --short`, untracked files, diff summary, verification gates and runtime/console proof.

## Exclusions preserved

No destructive Git operation, data reset, secrets exposure, redesign, backend migration, branch promotion, merge to `main`, deployment or new coaching rule.
