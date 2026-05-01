# Endurance Engine — AERION

Working product repo for the local-first endurance dashboard.

## Purpose

AERION is a local-first endurance performance system for athletes who must race from a fixed calendar while still building aerobic capacity, managing recovery, and tracking race cost.

The core rule:
Scheduled races are fixed. Do not block race participation unless injury or illness is present. If racing is suboptimal but mandatory, switch to damage-control and recovery-optimization mode.

## Current MVP

1. Import/read fixed race calendar.
2. Sync recent Intervals.icu activities and future race events on open when credentials are present.
3. Keep actual completed activity authoritative, even if the daily recommendation was not accepted/clicked.
4. Detect race-like activities and show them as completed race logs instead of generic actuals.
5. Calculate latest race cost.
6. Adapt daily recommendation around fixed races, recent load, and recovery.
7. Show dashboard:
   - today status
   - next race
   - opening sync status
   - operational race/activity/decision log
   - fatigue/recovery baseline
   - latest race cost
   - workout recommendation
   - fixed-race calendar and recent actual work
   - manual race/activity/block entry
   - local JSON export/import/reset controls

## Run locally

```bash
npm install
npm run start:aerion
```

`npm run start:aerion` loads `.env.local` if present, sets the default Intervals athlete ID to `i478692`, then starts Vite on `http://127.0.0.1:5174`.

To enable live opening sync:

```bash
cp .env.example .env.local
# edit .env.local and add INTERVALS_ICU_API_KEY
npm run start:aerion
```

Do not commit `.env.local`. The browser never receives the Intervals API key; `/api/sync` reads it server-side only.

## Verification

```bash
npm test
npm run typecheck
npm run build
curl -s http://127.0.0.1:5174/api/sync
```

## Current source of truth

Brain prototype:
`~/ColdDesert/brain/endurance/`

This repo is the productization layer. It should not require the ColdDesert brain long-term.
