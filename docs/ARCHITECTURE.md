# Architecture

## Current stack

- React + TypeScript + Vite frontend.
- Electron macOS packaging.
- Pure TypeScript coaching engines under `src/engine/`.
- Domain contracts under `src/domain/` and data adapters under `src/data/`.
- Local persistence in the app plus import/export controls.
- Vite middleware endpoints `/api/sync` and `/api/briefing` provide current server-side boundaries.
- Optional OpenAI MCP/briefing scripts under `scripts/`.

## Data boundary

Credentials belong in `.env.local` and server-side code only. Browser code must never receive API keys or OAuth secrets. Intervals.icu is the first live sync boundary; Garmin and Strava should remain explicitly adapter/manual until verified otherwise.

## Current risks to audit

1. `App.tsx` coordinates too many product and state concerns.
2. Vite middleware is carrying backend responsibilities without a durable service boundary.
3. Activity identity/dedupe logic may diverge across import paths.
4. App-derived coaching context and MCP context can drift.
5. Fixtures or hardcoded activities can contaminate real athlete state.

