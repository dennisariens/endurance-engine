# AERION Architecture — v2 Foundation

Last updated: 2026-07-29  
Branch: `refactor/v2-foundation`  
Scope executed: Phase 0 + Phase 1 only

## Direction

AERION is Dennis Ariens' local-first endurance control system: a race-control layer above Intervals.icu/Garmin/Strava-style data, not a generic fitness dashboard.

The v2 direction is to stabilize the foundation before adding larger intelligence layers. This pass deliberately does **not** build CanonicalAthleteState, Trajectory Engine, or Learning Engine yet.

## Product invariants

- Actual completed activities are authoritative.
- Fixed races remain fixed unless injury or illness is present.
- Advice remains advisory, not restrictive.
- Ignored advice becomes input state, not failure.
- Predictions remain ranges with confidence.
- No secrets in browser/client code, commits, logs, exports, or visible UI.
- Preserve existing product direction and visible UI while cleaning foundations.

---

# Current architecture after Phase 0/1

```text
AERION
├─ data/*.json
│  └─ local fixtures / fallback seed state
│
├─ src/domain/types.ts
│  └─ domain contracts: activities, races, current state, goals, decisions
│
├─ src/engine/*.ts
│  └─ pure decision/coaching/recovery/goal/path engines
│
├─ src/data/*.ts
│  ├─ freshness semantics
│  ├─ integration health
│  └─ health normalization
│
├─ src/data/integrations/*.ts
│  ├─ Intervals normalization
│  ├─ Garmin recovery snapshot normalization
│  ├─ Strava activity-proof normalization
│  └─ canonical activity/race dedupe helpers
│
├─ server/aerionApi.ts
│  └─ testable local API service layer for Intervals sync + briefing payload
│
├─ vite.config.ts
│  └─ thin Vite middleware wrapper around server/aerionApi.ts
│
├─ scripts/aerion-openai-mcp.mjs
│  └─ MCP stdio server that consumes shared /api/briefing context
│
├─ src/App.tsx
│  └─ app orchestration, local state, engine composition, premium UI shell
│
└─ electron/main.cjs
   └─ macOS desktop wrapper / local server launcher
```

---

# Phase 0 — repository baseline

## Done

- Created branch:

```bash
git checkout -b refactor/v2-foundation
```

- Added `release/` to `.gitignore` so Electron packaged artifacts are not baselined into git.
- Created a baseline commit of the current working source state:

```text
chore: baseline aerion v2 foundation start
```

## Rationale

The repo had substantial modified/untracked source work from prior AERION phases. The safe baseline preserves the working product state before foundation refactors, while excluding generated release binaries.

---

# Phase 1 — foundation cleanup

## 1. Hardcoded testdata removed from runtime

Removed runtime injection of:

```text
manual-20260430-sort-like-activity
```

from `src/App.tsx`.

AERION no longer silently inserts a fixed manual activity on startup/reset/import/sync. Existing localStorage data is not deleted or migrated. If that activity already exists in a user's local browser state, it remains user-owned data until explicitly reset/imported.

Commit:

```text
refactor: remove injected runtime fixture activity
```

## 2. Activity merge/dedupe centralized

`src/App.tsx` now uses the integration dedupe layer:

```ts
dedupeSyncedActivities()
mergeRacesByStableId()
```

from:

```text
src/data/integrations/dedupe.ts
```

Instead of using timeline-engine merge helpers for runtime ingestion. This makes integration-source priority the canonical app merge path.

Source priority remains:

1. manual
2. intervals
3. garmin
4. strava

Commit:

```text
refactor: centralize activity merge in integration dedupe
```

## 3. Freshness / stale-data semantics added

Added:

```text
src/data/freshness.ts
src/data/freshness.test.ts
```

Freshness now tracks:

- current recovery/readiness state
- latest activity evidence
- next fixed race
- opening sync receipt

Freshness states:

```ts
type FreshnessStatus = 'fresh' | 'aging' | 'stale' | 'missing'
```

The Data Hub integration-health layer can now surface stale/missing source messages without deleting or mutating data.

Commit:

```text
feat: add freshness semantics for local state
```

## 4. Intervals + briefing logic extracted from Vite config

Added:

```text
server/aerionApi.ts
server/aerionApi.test.ts
```

`vite.config.ts` is now a thin wrapper. The service layer owns:

- Intervals credential lookup from server env
- Intervals activities/wellness/events fetch
- Intervals normalization
- opening sync payload
- briefing payload construction
- fixture fallback when live sync is unavailable

Vite middleware now only wires:

- `/api/sync`
- `/api/briefing`

into those services.

Commit:

```text
refactor: extract local api services from vite config
```

## 5. MCP context uses shared briefing API

`scripts/aerion-openai-mcp.mjs` no longer builds its own local AERION context from JSON files.

It now consumes:

```text
/api/briefing?date=YYYY-MM-DD
```

from the same local service path the app uses.

This reduces drift between:

- app briefing context
- Hermes/FARIS context
- OpenAI MCP coaching context

Commit:

```text
refactor: route mcp context through shared briefing api
```

---

# Local API services

## `fetchIntervalsContext()`

Location:

```text
server/aerionApi.ts
```

Inputs:

- env map
- optional fetch implementation
- optional `now` date for tests

Outputs:

```ts
type OpeningSyncPayload = {
  ok: boolean
  source: 'intervals' | 'unavailable'
  message: string
  syncedAt?: string
  activities?: Activity[]
  races?: Race[]
  state?: Partial<CurrentState>
}
```

Behavior:

- missing Intervals key returns safe unavailable payload
- activity fetch failure returns safe unavailable payload
- wellness/events can degrade to empty arrays
- normalized output is in AERION domain types

## `buildBriefingPayload()`

Location:

```text
server/aerionApi.ts
```

Behavior:

- uses live Intervals sync when available
- falls back to local fixtures when unavailable
- builds payload through `buildAerionBriefingContext()`
- preserves `source: local-live | local-fixture`

---

# Data freshness model

## Freshness thresholds

| Source | Aging | Stale |
|---|---:|---:|
| current-state | 2 days | 7 days |
| activities | 4 days | 14 days |
| races | 14 days | 45 days |
| sync | 1 day | 3 days |

These are conservative defaults. They do not delete data; they only describe confidence/freshness.

## Important distinction

Freshness is **not** authority.

- Completed activities still override plan/log intent.
- Stale data is still preserved.
- Staleness reduces confidence and should be shown as context.
- If migration risk appears, stop and report rather than deleting data.

---

# Current boundaries

## Client/browser

Client can:

- read local fixture data bundled in app
- store local app state in localStorage
- call local `/api/sync` and `/api/briefing`
- import/export local JSON backups
- import Garmin/Strava JSON snapshots

Client must not:

- receive private API keys
- import `.env` files
- call Intervals/OpenAI directly with secrets

## Server/local API

Server service can:

- read server environment
- call Intervals.icu
- build briefing payloads
- expose safe JSON to local client

## MCP

MCP can:

- list tools over stdio
- call shared local `/api/briefing`
- call OpenAI only if a server-side key exists

MCP should not:

- build separate divergent context from fixtures
- expose credential values

---

# Deviations from the v2 proposal

The full AERION v2 proposal text was not included in the active prompt, so this implementation followed the explicit Phase 0/1 instructions only.

Deliberate deviations / deferrals:

1. **CanonicalAthleteState not built yet**
   - Deferred to Phase 2.
   - Reason: too large for the foundation cleanup round.

2. **Trajectory Engine not built yet**
   - Deferred to Phase 2+.
   - Reason: requires stable canonical state first.

3. **Learning Engine not built yet**
   - Deferred.
   - Reason: needs reliable event history, source freshness, and state migration policy.

4. **No visible product direction changes**
   - UI remained structurally the same.
   - Freshness only feeds existing integration-health semantics.

5. **No destructive local-data migration**
   - Hardcoded runtime injection was removed.
   - Existing localStorage/user data is not deleted.

6. **MCP depends on local AERION API availability**
   - The MCP now uses `/api/briefing` for shared context.
   - If the app/local server is not running, it returns a clear unavailable response instead of silently building a separate context.

---

# Verification commands

After each logical step:

```bash
npm test
npm run typecheck
```

Final verification should also run:

```bash
npm run build
```

---

# Proposed Phase 2

Phase 2 should be a state-boundary refactor, not a new dashboard pass.

Recommended sequence:

1. Introduce `CanonicalAthleteState` as a derived, typed state object.
2. Create `buildCanonicalAthleteState()` from:
   - local fixture/current state
   - synced activities
   - races
   - goals
   - freshness report
   - integration health
3. Move `App.tsx` orchestration into hooks:
   - `useAerionState()`
   - `useOpeningSync()`
   - `useAerionDerivedState()`
   - `useAerionImports()`
4. Make engines consume canonical state gradually.
5. Add freshness-aware confidence to coach briefing and scenario simulation.
6. Add migration-safe localStorage versioning.
7. Only after that: Trajectory Engine.
8. Only after trajectory history is stable: Learning Engine.
