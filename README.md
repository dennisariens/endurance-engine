# Endurance Engine — AERION

Working product repository for Dennis Ariens' private, local-first AI endurance coach.

## Product rule

Reality beats plan. Completed activity is authoritative; fixed races remain fixed unless injury or illness is present; recommendations explain consequences without moralizing.

## Current authority

- Product branch: `refactor/v2-foundation`
- Verified remote baseline: `01db3bf5dc4d2c9cdf0dd9a82d98939cfdd2d315`
- `main` is a minimal placeholder with separate history and must not be treated as the product baseline.
- Previous local audit reported newer modified and untracked Mac files. Reconcile those before any branch promotion or destructive cleanup.

## Workflow

The **HR Chest Strap Insights** conversation is Dennis's single Aerion front door. The assistant handles coaching, product direction, research and routine changes directly, or scopes substantial implementation for Codex. GitHub task and handoff files are the durable relay between conversation histories.

Read `AGENTS.md` → `PROJECT.md` → `STATE.md` → `DECISIONS.md` → `tasks/ACTIVE.md`.

## Run locally

```bash
npm install
npm run start:aerion
```

Do not commit `.env.local`. Before claiming implementation complete, run `npm test`, `npm run typecheck`, and `npm run build`.

