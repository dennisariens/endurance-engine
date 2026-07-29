# AGENTS.md — AERION Endurance Engine

## Mission

Build AERION into Dennis Ariens' personal AI endurance coach: a reality-aware endurance control system for fixed-race athletes.

This is not a generic fitness app. It is a race-control layer above Intervals.icu/Garmin-style data.

## Product rules

- Reality > plan.
- Actual completed activities are authoritative.
- Fixed races remain fixed unless injury or illness is present.
- Recommendations are advisory, not restrictive.
- Ignored advice is not failure; it is new input state.
- Explain consequences without scolding.
- Predictions are ranges with confidence, never certainty.

## Visual direction

EF / Rapha / Breakaway-inspired:
- premium cycling utility
- mobile-first race-control feel
- deep black / graphite base
- ice-blue system accent
- restrained green / amber / red states
- crisp typography and high readability
- no generic SaaS styling, muddy overlays, or bro-fitness language

## Architecture rules

- Keep coaching logic in pure engines under `src/engine/` before adding React UI.
- React panels live under `src/components/`.
- Domain types live in `src/domain/types.ts`.
- Data normalization lives under `src/data/` or dedicated engine modules.
- Browser must never receive private API keys.
- `.env.local` is private and must not be echoed, logged, exported, or committed.

## Verification gate

Before claiming completion, run:

```bash
npm test
npm run typecheck
npm run build
```

For UI work also verify locally:

```bash
npm run dev
# open http://127.0.0.1:5174/
```

Check browser console for errors and visually inspect the dashboard. Do not stop Hermes Web Dashboard on `127.0.0.1:9119`.

## Current north star

Fully functional Personal AI Endurance Coach:
- opening sync from Intervals.icu
- Garmin/readiness transparency
- race-cost explanation
- 72h recovery control plan
- Goal Readiness + Path to Goal
- scenario simulation: race/rest/easy/ignore
- coach briefing with status, recommendation, consequence, next action
- mobile-first premium race-control UI
