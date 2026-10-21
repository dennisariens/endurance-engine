# AGENTS.md — AERION Endurance Engine

## Mission

Build AERION into Dennis Ariens' private AI endurance coach: a reality-aware endurance control system for fixed-race athletes. Keep it separate from the Eintracht Frankfurt Eagles Race Engine.

## Product rules

- Reality > plan.
- Actual completed activities are authoritative.
- Fixed races remain fixed unless injury or illness is present.
- Recommendations are advisory, not restrictive.
- Ignored advice is new input state, not failure.
- Explain consequences without scolding.
- Predictions are ranges with confidence, never certainty.

## Visual direction

- Premium endurance utility inspired by Breakaway, Rapha, MAAP and EF Cycling without copying them.
- Deep black / navy / graphite base, restrained coral action accent and cyan telemetry.
- One dominant answer per screen; calm evidence hierarchy; no generic SaaS card wall.
- Preserve the active contracts in `BRAND.md` and `DESIGN.md`.

## Architecture rules

- Keep coaching logic in pure engines under `src/engine/` before adding React UI.
- React panels live under `src/components/`; domain types live in `src/domain/types.ts`.
- Data normalization belongs under `src/data/` or dedicated engine modules.
- Never expose, echo, log, export or commit secrets or `.env.local`.
- Preserve sync, timeline, logs, `baselineConfig`, HR labels, tests, auth boundaries and data contracts.

## Repository workflow

- Current product authority: `refactor/v2-foundation` until AERION-001 resolves promotion to `main`.
- Dennis's primary conversation is **HR Chest Strap Insights**.
- Use `codex/<task-id>-<slug>` for implementation tasks.
- Read `STATE.md`, `DECISIONS.md` and `tasks/ACTIVE.md` before edits.
- Preserve unrelated and uncommitted user work. Never clean or overwrite the Mac checkout without explicit confirmation.
- Report exact commits, files, checks, limitations and deployment state in `handoffs/CODEX_TO_WORK.md`.

## Verification gate

```bash
npm test
npm run typecheck
npm run build
```

For UI work, run the app at `http://127.0.0.1:5174/`, inspect desktop and mobile views, and check browser console errors. Do not stop Hermes Web Dashboard on `127.0.0.1:9119`.

## External research capture — Main owns this

- When a third-party repository, product, scientific source or design reference is reviewed and contains durable AERION-relevant insights, **Main proactively records** a concise source-linked decision/research note in this repository. Do not make the owner remind you.
- Record reusable patterns, applicability to AERION's actual implementation, evidence/uncertainty, licensing and privacy constraints, and **what not to implement**. Prefer updating an existing note over duplicate docs; do not commission work solely to capture research.
- Keep current product priorities intact: Personal Beta real-data sync, truthfulness, safety, secure persistence and Mac/iPhone access before wearable experiments or public-site design.
- First recorded study: [Atria + NOOP technical extraction](docs/EXTERNAL_REFERENCES_ATRIA_NOOP_2026-10-21.md) (2026-10-21). Includes source-pinned references, confidence/provenance rules, potential recovery research and noncommercial-code restrictions.
- Documentation capture does **not** authorize merging, deployment, importing third-party code or introducing new release blockers.
