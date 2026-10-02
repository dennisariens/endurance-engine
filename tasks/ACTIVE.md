# AERION-001 — Baseline and source reconciliation audit

Status: ready for Codex audit  
Owner: Work · Executor: Codex  
Base branch: `refactor/v2-foundation`  
Base commit: `01db3bf5dc4d2c9cdf0dd9a82d98939cfdd2d315`  
Task branch: `codex/aerion-001-baseline-audit`

## Goal

Establish one trustworthy Aerion source baseline without losing remote or local work.

## Scope

1. Inventory the remote product branch and relevant architecture/data contracts.
2. On Dennis's Mac, inspect Git status and identify modified/untracked files without cleaning, resetting or overwriting them.
3. Compare the Mac checkout with the verified remote base and classify local-only, remote-only and conflicting work.
4. Run `npm test`, `npm run typecheck`, and `npm run build` where dependencies and secrets permit.
5. Verify the app at `127.0.0.1:5174` on desktop and mobile where available; record console/runtime failures.
6. Audit the known risks recorded in `PROJECT_CONTEXT.md` without implementing broad fixes.
7. Recommend a safe canonical-branch and next-task plan.

## Acceptance

- [x] Repository, product branch and exact remote base SHA recorded.
- [ ] Mac working-tree state inventoried without mutation.
- [ ] Remote/local differences classified with preservation plan.
- [ ] Tests, typecheck and build run or limitations stated.
- [ ] Current primary UI and data-source status verified.
- [ ] Known architecture/data risks confirmed, corrected or explicitly disproved.
- [ ] Work receives evidence and a bounded next-task recommendation.

## Exclusions

No destructive Git operation, data reset, secrets exposure, redesign, backend migration, branch promotion, merge to `main`, deployment or new coaching rule.

