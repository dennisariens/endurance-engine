# AERION Architecture — v2 Foundation

Last updated: 2026-07-31  
Branch: `refactor/v2-foundation`  
Scope executed: Phase 0 + Phase 1 + Phase 2 draft + Phase 2 hardening pass

## Direction

AERION is Dennis Ariens' local-first endurance control system: a race-control layer above Intervals.icu/Garmin/Strava-style data, not a generic fitness dashboard.

The v2 direction is to stabilize the foundation before adding larger intelligence layers. This pass introduced a derived CanonicalAthleteState v2 draft, but deliberately does **not** build Trajectory Engine or Learning Engine yet.

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
│  ├─ canonical evidence records
│  ├─ integration health
│  └─ health normalization
│
├─ src/state/*.ts
│  └─ CanonicalAthleteState v2 draft builder
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

- Created local baseline tag on that checkpoint:

```text
v1-local-control -> 54f22e6
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

# Phase 2 — Canonical Athlete State draft

## 1. EvidenceRecord introduced

Added:

```text
src/data/evidence.ts
src/data/evidence.test.ts
```

The evidence layer now normalizes current runtime inputs into traceable records for:

- activities;
- current recovery/readiness state;
- races;
- goals;
- freshness report.

Each record carries:

- source;
- kind;
- observed/received timestamps;
- quality;
- confidence;
- provenance.

This is the first canonical evidence path. It is still in-memory/derived, not yet persisted to SQLite.

Commit:

```text
feat: add canonical evidence records
```

## 2. CanonicalAthleteState v2 draft introduced

Added:

```text
src/state/canonicalAthleteState.ts
src/state/canonicalAthleteState.test.ts
```

The state builder derives one typed athlete-state interpretation from:

- current state;
- activities;
- races;
- goals;
- freshness;
- evidence records.

Current state version:

```text
canonical-athlete-state-v2-draft-1
```

The draft includes:

- freshness;
- recovery status/confidence/missing signals;
- fatigue load summary;
- fitness proxy values;
- health block status;
- behaviour proxy values;
- active goal state;
- deterministic constraints;
- evidence summary and warnings.

Commit:

```text
feat: introduce canonical athlete state draft
```

## 3. Shared context exposure

`buildAerionBriefingContext()` now includes:

```text
control.athleteState
control.evidence
control.freshness
```

The local briefing API and MCP bridge therefore consume the same generated state output.

MCP tools added:

```text
get_athlete_state
get_data_freshness
```

Commit:

```text
feat: expose canonical athlete state in shared context
```

## 4. Phase 2 hardening pass — 2026-07-31

Added localStorage schema versioning and migration guards:

```text
src/lib/storage.ts
src/lib/storage.test.ts
```

Behavior:

- existing v1 raw JSON localStorage values are read as-is;
- the next save wraps values in a v2 envelope with `schemaVersion`, `savedAt`, and optional `migratedFrom`;
- future/unknown schema envelopes return the safe fallback and are left untouched as user-owned data;
- corrupt JSON falls back without throwing or deleting data.

Backup/export files now use the current local storage schema version while still accepting v1 backups.

Added adapter-to-evidence contract coverage:

```text
src/data/integrations/adapterEvidenceContract.test.ts
```

This verifies Intervals, Strava, Garmin-derived state, races, goals, and freshness records can flow into the canonical evidence layer with stable evidence IDs and confidence values.

Split opening-sync orchestration out of `App.tsx`:

```text
src/hooks/useOpeningSync.ts
```

Continued app-orchestration split:

```text
src/hooks/useAerionState.ts
src/hooks/useAerionDerivedState.ts
src/hooks/useAerionImports.ts
```

This keeps visible UI unchanged while moving local persisted state, pure derived dashboard state, and import/export handlers out of `src/App.tsx`. `App.tsx` remains the composition shell for now; full component-level panel decomposition remains deferred.

MCP responses now include response metadata:

```text
responseMetadata.stateGeneratedAt
responseMetadata.engineVersion
responseMetadata.confidence
responseMetadata.evidenceIds
```

The MCP server version is now `1.2.0`.

## 5. First CanonicalAthleteState runtime adoption — 2026-07-31

`useAerionDerivedState()` now derives app-local evidence and a `CanonicalAthleteState` draft alongside freshness:

```text
buildFreshnessReport()
buildEvidenceRecords()
buildCanonicalAthleteState()
```

`buildMorningReadinessVerdict()` accepts optional `athleteState` input. The engine still preserves existing actuals-first/readiness behavior, but can now use canonical state as advisory evidence for:

- health/recovery hard blocks;
- stale canonical state warnings;
- missing recovery signal warnings.

This is intentionally a narrow adoption path. It does not replace all engine inputs, and it does not add Trajectory Engine or Learning Engine.

## Phase 2 deferrals

This is a Phase 2 draft, not the final v2 state boundary.

Deferred deliberately:

- persisted Evidence Store;
- SQLite state snapshots;
- replacing all engines with CanonicalAthleteState input;
- Trajectory Engine;
- Learning Engine;
- visible Mission Control redesign.

---

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

The full AERION v2 proposal is now preserved below as Appendix A. Phase 0/1 is complete. Phase 2 has a drafted canonical state boundary plus a first hardening pass; larger intelligence systems remain deliberately deferred.

Deliberate deviations / deferrals:

1. **CanonicalAthleteState is draft-only**
   - Built as derived in-memory state, exposed through shared context.
   - Not yet persisted to SQLite and not yet the input contract for every engine.

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

# Proposed next phase after Phase 2 draft

The Phase 2 draft introduced the typed state boundary. The next phase should harden and adopt it, not add new dashboards.

Recommended sequence:

1. Add persisted state snapshots. ✅ LocalStorage schema versioning added in hardening pass; persisted state snapshots remain deferred.
2. Add adapter-to-evidence contract tests for Intervals/Garmin/Strava/manual inputs. ✅ First Intervals/Garmin/Strava contract coverage added.
3. Move `App.tsx` orchestration into hooks:
   - `useOpeningSync()` ✅ extracted.
   - `useAerionState()` deferred.
   - `useAerionDerivedState()` deferred.
   - `useAerionImports()` deferred.
4. Make engines consume CanonicalAthleteState gradually.
5. Add freshness-aware confidence to coach briefing and scenario simulation.
6. Add MCP response metadata: state generation time, engine version, evidence IDs. ✅ Added for MCP context/state/freshness/OpenAI responses.
7. Only after those adoption steps: Trajectory Engine.
8. Only after trajectory history is stable: Learning Engine.

---

# Appendix A — AERION V2 Architecture & Product Direction

**Status:** Proposed architecture  
**Product:** AERION Endurance Operating System  
**Primary mission:** Amsterdam Marathon sub 3  
**Architecture principle:** Decision-driven, explainable and adaptive  
**Runtime:** Local-first macOS application with MCP access  
**Owner:** ColdDesert / Dennis Ariens

---

## 1. Executive summary

AERION v1 has established a strong technical foundation:

- a central TypeScript domain model;
- pure decision and coaching engines;
- Intervals.icu activity, wellness and event ingestion;
- Garmin and Strava import adapters;
- actual-completed-work override semantics;
- morning readiness and 72-hour recovery planning;
- goal readiness and path-to-goal logic;
- an Electron desktop application;
- an MCP bridge for Hermes and OpenAI.

AERION v2 should not focus primarily on adding more screens, charts or integrations.

The next objective is to transform AERION from a collection of intelligent engines into one coherent endurance decision system.

AERION v2 should answer five questions continuously:

1. What is the athlete’s current state?
2. Where is the athlete heading?
3. Which decision best improves that trajectory?
4. How confident is AERION in that decision?
5. What did AERION learn from the result?

The defining loop becomes:

```text
Observe
   ↓
Model
   ↓
Predict
   ↓
Simulate
   ↓
Decide
   ↓
Explain
   ↓
Observe actual outcome
   ↓
Learn
```

---

# 2. Product definition

## 2.1 What AERION is

AERION is a personal endurance operating system that converts training, recovery, race and goal data into daily decisions.

It is not primarily:

- an activity tracker;
- a training calendar;
- a static training-plan generator;
- an HRV dashboard;
- an AI chat interface.

Its primary output is a decision.

Example:

> Run 12 km easy today, with heart rate between 138 and 145 bpm. Do not add strides. Your marathon-specific session in two days has greater expected value than additional intensity today.

## 2.2 Core promise

> AERION helps the athlete make the best available training decision today without losing sight of the long-term objective.

## 2.3 Current primary use case

The initial proof case for v2 is:

> Prepare Dennis for a sub-3-hour Amsterdam Marathon while adapting daily to completed training, recovery, available time and race commitments.

The system may later support cycling, triathlon and ultra-endurance objectives, but running toward Amsterdam should be the reference implementation.

---

# 3. Non-negotiable product principles

## 3.1 Actual work is authoritative

Completed activities override:

- the scheduled workout;
- the recommended workout;
- the athlete’s logged intention;
- the previous forecast.

AERION must always recalculate from what actually happened.

```text
Plan ≠ truth
Intent ≠ truth
Completed work = new truth
```

## 3.2 Fixed races remain fixed

A fixed race remains in the operating model unless:

- injury blocks participation;
- illness blocks participation;
- the athlete explicitly removes or changes it.

AERION adapts the surrounding plan instead of pretending the race does not exist.

## 3.3 Safety logic is deterministic

Language models may explain, summarize and offer options.

They must not independently override:

- injury blocks;
- illness blocks;
- recovery guardrails;
- maximum load constraints;
- hard race-date constraints;
- minimum recovery requirements.

## 3.4 Every recommendation must be explainable

A decision should include:

- the recommendation;
- the dominant reason;
- supporting evidence;
- relevant uncertainty;
- what would change the decision;
- likely consequence of ignoring it.

## 3.5 Precision must reflect evidence

AERION should not show an exact prediction when the evidence does not justify one.

Bad:

> Sub-3 probability: 87.3%

Better:

> Sub-3 is plausible, but marathon durability is not yet sufficiently validated.

Later, when calibrated against enough personal data:

> Estimated sub-3 probability: 70–82%.

---

# 4. Target architecture

```text
External Sources
Intervals / Garmin / Strava / Manual
                 │
                 ▼
        Integration Gateway
                 │
                 ▼
      Canonical Evidence Store
                 │
                 ▼
        Canonical Athlete State
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
Trajectory Engine     Constraint Engine
       │                   │
       └─────────┬─────────┘
                 ▼
        Scenario Simulator
                 │
                 ▼
          Decision Engine
                 │
                 ▼
         Confidence Engine
                 │
                 ▼
          Explanation Layer
                 │
       ┌─────────┴──────────┐
       ▼                    ▼
Mission Control         MCP / Hermes
       │
       ▼
Completed actual outcome
       │
       ▼
          Learning Engine
```

---

# 5. Canonical Evidence Store

## 5.1 Purpose

The current project loads information from fixtures, localStorage, Intervals.icu and manual imports.

V2 should first normalize all observations into one evidence model before updating the athlete state.

An observation is a fact received from a source.

Examples:

- a completed run;
- an HRV reading;
- sleep duration;
- resting heart rate;
- a scheduled race;
- self-reported soreness;
- an imported injury flag.

## 5.2 Evidence model

```ts
type EvidenceSource =
  | "intervals"
  | "garmin"
  | "strava"
  | "manual"
  | "aerion"
  | "derived";

type EvidenceQuality =
  | "verified"
  | "reported"
  | "estimated"
  | "stale"
  | "missing";

type EvidenceRecord<T = unknown> = {
  id: string;
  athleteId: string;
  kind: string;
  source: EvidenceSource;
  observedAt: string;
  receivedAt: string;
  value: T;
  quality: EvidenceQuality;
  confidence: number;
  freshnessHours?: number;
  provenance?: {
    externalId?: string;
    adapterVersion?: string;
    calculationVersion?: string;
  };
};
```

## 5.3 Why this layer matters

Without a canonical evidence layer, engines may calculate from subtly different inputs.

For example:

- Recovery may use a current HRV value.
- Scenario simulation may use a stale recovery status.
- The UI may display fixture data.
- Hermes may independently read another context file.

The Evidence Store ensures that every downstream decision can be traced back to the same facts.

---

# 6. Canonical Athlete State

## 6.1 Purpose

The Athlete State is the best current interpretation of all available evidence.

It is not a raw API response and not a collection of UI metrics.

It represents what AERION currently believes about the athlete.

## 6.2 Proposed model

```ts
type CanonicalAthleteState = {
  athleteId: string;
  generatedAt: string;
  stateVersion: string;

  identity: {
    age?: number;
    sex?: "male" | "female" | "other";
    bodyMassKg?: number;
    heightCm?: number;
  };

  freshness: {
    activitiesUpdatedAt?: string;
    recoveryUpdatedAt?: string;
    wellnessUpdatedAt?: string;
    calendarUpdatedAt?: string;
    overall: "fresh" | "partial" | "stale";
  };

  recovery: {
    status: "green" | "yellow" | "red" | "blocked";
    score?: number;
    confidence: number;
    dominantSignals: string[];
    missingSignals: string[];
  };

  fatigue: {
    acuteLoad?: number;
    chronicLoad?: number;
    loadBalance?: number;
    neuromuscular?: number;
    metabolic?: number;
    musculoskeletal?: number;
    subjective?: number;
    confidence: number;
  };

  fitness: {
    aerobicCapacity?: number;
    thresholdCapacity?: number;
    speedReserve?: number;
    endurance?: number;
    durability?: number;
    fatigueResistance?: number;
    confidence: number;
  };

  health: {
    injuryStatus: "clear" | "watch" | "limited" | "blocked";
    illnessStatus: "clear" | "watch" | "limited" | "blocked";
    soreness?: number;
    pain?: number;
    notes?: string[];
  };

  behaviour: {
    complianceRate?: number;
    completionRate?: number;
    tendencyToOverreach?: number;
    tendencyToUndershoot?: number;
    preferredTrainingDays?: string[];
    confidence: number;
  };

  availability: {
    todayMinutes?: number;
    weeklyHours?: number;
    blockedDates: string[];
  };

  activeGoal: GoalState;
  upcomingConstraints: Constraint[];

  evidenceSummary: {
    includedEvidenceIds: string[];
    excludedEvidenceIds: string[];
    warnings: string[];
  };
};
```

## 6.3 Athlete State rules

- Every field must include or inherit confidence.
- Stale evidence may not silently behave as fresh evidence.
- Missing data should reduce confidence rather than automatically create a red state.
- Manual athlete input may override derived state, but the override must be logged.
- State generation should be deterministic and versioned.

---

# 7. Goal State

```ts
type GoalState = {
  goalId: string;
  name: string;
  discipline: "running" | "cycling" | "triathlon" | "ultra";
  eventDate: string;
  priority: "A" | "B" | "C";
  target?: {
    timeSeconds?: number;
    distanceKm?: number;
    outcome?: string;
  };

  phase:
    | "foundation"
    | "development"
    | "specific"
    | "peak"
    | "taper"
    | "race"
    | "recovery";

  weeksRemaining: number;

  readiness: {
    overall: number;
    speed: number;
    aerobicEndurance: number;
    durability: number;
    recoveryCapacity: number;
    executionReadiness: number;
    confidence: number;
  };

  limitingFactors: LimitingFactor[];
};
```

For Amsterdam sub 3, readiness should initially use at least:

- threshold and 10 km-level speed;
- weekly volume consistency;
- long-run progression;
- marathon-pace durability;
- heart-rate stability;
- late-run pace deterioration;
- recovery consistency;
- fueling execution;
- injury continuity.

---

# 8. Trajectory Engine

## 8.1 Purpose

The current state says where the athlete is now.

The Trajectory Engine estimates where the athlete is heading if current behaviour continues.

It should answer:

- Is fitness improving?
- Is durability developing quickly enough?
- Is accumulated fatigue sustainable?
- Is the athlete on track for the goal date?
- Which ability is likely to become the limiting factor?
- When should the next key validation occur?

## 8.2 Trajectory horizons

AERION should model four horizons:

### Immediate

Next 72 hours.

Purpose:

- recovery;
- execution;
- short-term risk;
- race proximity.

### Weekly

Current and following training week.

Purpose:

- load distribution;
- key-session placement;
- long-run placement;
- intensity balance.

### Development block

Next three to six weeks.

Purpose:

- physiological priority;
- progressive overload;
- durability development;
- validation sessions.

### Goal horizon

Until target event.

Purpose:

- required progress rate;
- taper timing;
- readiness gaps;
- realistic target range.

## 8.3 Proposed output

```ts
type AthleteTrajectory = {
  generatedAt: string;

  direction:
    | "improving"
    | "stable"
    | "declining"
    | "uncertain";

  goalProjection: {
    status:
      | "ahead"
      | "on-track"
      | "at-risk"
      | "off-track"
      | "insufficient-data";
    confidence: number;
    expectedRange?: {
      lower: number;
      upper: number;
      unit: string;
    };
  };

  trends: {
    fitness: Trend;
    fatigue: Trend;
    durability: Trend;
    recovery: Trend;
    consistency: Trend;
  };

  primaryLimiter?: LimitingFactor;
  nextValidation?: ValidationSession;
  warnings: string[];
};
```

---

# 9. Constraint Engine

## 9.1 Purpose

Constraints define what AERION may and may not recommend.

Examples:

- injury;
- illness;
- race tomorrow;
- two high-intensity sessions already completed;
- insufficient recovery after a long race;
- limited training time;
- taper phase;
- maximum safe weekly increase.

## 9.2 Constraint types

```ts
type Constraint = {
  id: string;
  type:
    | "health"
    | "recovery"
    | "calendar"
    | "load"
    | "availability"
    | "goal"
    | "athlete-rule";
  severity: "advisory" | "soft" | "hard";
  validFrom: string;
  validUntil?: string;
  reason: string;
  evidenceIds: string[];
};
```

## 9.3 Hard constraints

Hard constraints cannot be overridden by the AI explanation layer.

Examples:

- confirmed injury block;
- illness with systemic symptoms;
- race-day participation block;
- explicit medical restriction;
- user-defined unavailable date.

## 9.4 Soft constraints

Soft constraints may be traded against expected training value.

Examples:

- mild fatigue;
- slightly reduced HRV;
- limited time;
- small load spike;
- upcoming race not marked as A priority.

---

# 10. Scenario Simulator

## 10.1 Purpose

Before selecting a decision, AERION should compare plausible alternatives.

Example scenarios:

- prescribed threshold workout;
- reduced threshold workout;
- easy run;
- recovery run;
- rest;
- bike replacement;
- moving the key session to tomorrow.

## 10.2 Scenario output

```ts
type TrainingScenario = {
  scenarioId: string;
  prescription: WorkoutPrescription;

  expectedEffects: {
    fitnessGain: Range;
    fatigueCost: Range;
    recoveryHours: Range;
    injuryRiskDelta: Range;
    goalReadinessDelta: Range;
    keySessionImpact: Range;
  };

  constraintsSatisfied: string[];
  constraintsViolated: string[];

  confidence: number;
  assumptions: string[];
};
```

## 10.3 Decision scoring

```text
Decision value =
expected goal contribution
+ expected fitness adaptation
+ execution probability
- fatigue cost
- injury risk
- interference with future key sessions
- uncertainty penalty
```

These weights must eventually be personalised.

---

# 11. Decision Engine v2

## 11.1 Purpose

The Decision Engine selects the best available scenario after applying constraints.

It should not generate natural language.

It should return a structured decision object.

## 11.2 Proposed contract

```ts
type AerionDecision = {
  decisionId: string;
  generatedAt: string;
  validUntil: string;

  status:
    | "recommended"
    | "modified"
    | "restricted"
    | "blocked";

  selectedScenarioId: string;
  workout: WorkoutPrescription;

  rationale: {
    primaryReason: string;
    supportingReasons: string[];
    dominantConstraint?: string;
    evidenceIds: string[];
  };

  consequence: {
    expectedBenefit: string;
    expectedCost: string;
    ignoringAdvice: string;
  };

  confidence: DecisionConfidence;

  alternatives: {
    scenarioId: string;
    label: string;
    tradeoff: string;
  }[];

  reviewTriggers: ReviewTrigger[];
};
```

## 11.3 Review triggers

A decision can be recalculated when:

- a completed activity arrives;
- new sleep data arrives;
- HRV changes materially;
- the athlete reports pain or illness;
- weather materially affects execution;
- available time changes;
- a race is added or removed;
- the athlete rejects the recommendation.

---

# 12. Confidence Engine

## 12.1 Purpose

Confidence should describe the quality of the decision, not how strongly AERION feels about it.

## 12.2 Confidence dimensions

```ts
type DecisionConfidence = {
  overall: number;

  components: {
    dataFreshness: number;
    dataCompleteness: number;
    modelReliability: number;
    athleteSpecificity: number;
    scenarioSeparation: number;
  };

  label: "low" | "moderate" | "high";

  reasons: string[];
  missingEvidence: string[];
};
```

## 12.3 Example

> Confidence: moderate  
> Activity and load data are current, but sleep and HRV data are missing. The easy-run recommendation is robust to those missing signals, but the exact duration is less certain.

This is more useful than simply displaying “82% confidence.”

---

# 13. Learning Engine

## 13.1 Purpose

AERION should gradually learn how Dennis personally responds to training.

It should not assume generic population responses indefinitely.

## 13.2 Learnable athlete characteristics

- recovery time after races;
- recovery time after long runs;
- HRV response to intensity;
- resting-HR response to fatigue;
- pace at a given heart rate;
- heart-rate drift;
- fatigue resistance;
- injury sensitivity to load changes;
- ideal spacing between quality sessions;
- response to weekly volume;
- compliance patterns;
- preferred workout formats;
- sleep sensitivity;
- heat sensitivity.

## 13.3 Outcome record

```ts
type DecisionOutcome = {
  decisionId: string;

  planned: WorkoutPrescription;
  completed?: Activity;

  execution: {
    completed: boolean;
    adherenceScore: number;
    deviationReasons: string[];
  };

  response: {
    immediateRpe?: number;
    nextMorningRecovery?: number;
    hrvDelta?: number;
    restingHrDelta?: number;
    sorenessDelta?: number;
    performanceChange?: number;
  };

  learningSignals: {
    predictedRecoveryHours?: number;
    actualRecoveryHours?: number;
    predictionError?: number;
  };
};
```

## 13.4 Initial learning approach

V2 should not begin with an opaque machine-learning model.

Start with:

- rolling baselines;
- athlete-specific multipliers;
- prediction-error tracking;
- Bayesian-style confidence updates;
- rule calibration;
- clear version history.

Only introduce more advanced modelling when sufficient personal data exists.

---

# 14. Planning Engine

## 14.1 Rolling plan

The plan should be continuously recalculated while preserving structural intent.

For the marathon use case:

- one long run per week;
- one threshold or interval stimulus;
- one marathon-specific stimulus where appropriate;
- remaining volume predominantly easy;
- a controlled progression in long-run duration;
- increasing marathon-pace durability;
- a two- to three-week taper;
- no automatic “catch-up” of missed sessions.

## 14.2 Session roles

```ts
type SessionRole =
  | "recovery"
  | "aerobic-volume"
  | "long-run"
  | "threshold"
  | "vo2max"
  | "marathon-specific"
  | "durability"
  | "race"
  | "validation";
```

The Decision Engine may change the workout while preserving the role.

Example:

```text
Original role: threshold development
Original session: 4 × 2 km threshold

Modified session: 3 × 2 km controlled threshold

Role preserved: yes
Cost reduced: moderate
Reason: incomplete recovery
```

## 14.3 Key sessions

The plan should identify sessions whose value is greater than normal daily training.

Examples:

- first 30 km long run;
- marathon-pace block in a long run;
- half-marathon validation race;
- final major long run;
- race-fueling rehearsal.

Daily decisions should protect these sessions.

---

# 15. Marathon Readiness Model

## 15.1 Four primary dimensions

### Speed

Does the athlete possess sufficient basic speed and threshold capacity?

Possible evidence:

- 5 km;
- 10 km;
- threshold intervals;
- estimated critical speed.

### Aerobic endurance

Can the athlete sustain sufficient duration and weekly volume?

Possible evidence:

- weekly distance;
- long-run duration;
- aerobic efficiency;
- accumulated easy volume.

### Durability

Can the athlete maintain pace and mechanics after prolonged running?

Possible evidence:

- pace fade;
- heart-rate drift;
- final-third performance;
- marathon-pace blocks late in long runs;
- repeatability across weeks.

### Execution readiness

Can the athlete execute the race plan?

Possible evidence:

- fueling tolerance;
- pacing discipline;
- race-specific footwear;
- hydration;
- warm-up and logistics;
- taper response.

## 15.2 Readiness presentation

```text
Amsterdam sub 3

Speed                Ready
Aerobic endurance    On track
Durability           Developing
Recovery consistency Good
Execution readiness  Not validated

Overall assessment:
Sub 3 remains plausible.

Primary limiter:
Late-run marathon-pace durability.

Next validation:
28 km with 12 km at marathon effort.
```

---

# 16. Explanation Layer and AI Coach

## 16.1 Role of Hermes/OpenAI

Hermes or OpenAI may:

- explain the structured decision;
- answer questions about it;
- summarize changes;
- compare alternatives;
- convert it into a morning briefing;
- present motivational or direct coaching language.

Hermes or OpenAI may not invent the underlying decision independently.

## 16.2 Required context

```ts
type CoachContext = {
  athleteState: CanonicalAthleteState;
  trajectory: AthleteTrajectory;
  decision: AerionDecision;
  scenarios: TrainingScenario[];
  recentOutcomes: DecisionOutcome[];
  activeGoal: GoalState;
};
```

## 16.3 Example response

> Today’s decision is 12 km easy at 138–145 bpm.
>
> The primary reason is that yesterday’s completed load was higher than planned. Recovery is adequate for aerobic work but not strong enough to justify threshold training. Moving threshold to Friday protects the quality of that session and keeps the weekly structure intact.
>
> Confidence is moderate because current activity data is fresh, but last night’s sleep data is unavailable.

---

# 17. MCP architecture

## 17.1 One shared truth

Hermes, ChatGPT and future agents should not calculate independent versions of athlete state.

They should query the same structured AERION outputs.

## 17.2 Proposed read tools

```text
get_aerion_status
get_athlete_state
get_active_goal
get_current_trajectory
get_today_decision
get_decision_explanation
get_training_scenarios
get_recent_outcomes
get_upcoming_plan
get_data_freshness
```

## 17.3 Proposed controlled write tools

```text
record_subjective_checkin
set_available_training_time
accept_decision
select_alternative
record_pain
record_illness
add_fixed_race
update_goal
```

## 17.4 Administrative tools

```text
run_sync
rebuild_athlete_state
recalculate_plan
get_engine_versions
get_decision_trace
```

## 17.5 MCP response rule

Every MCP response involving a recommendation should expose:

- decision ID;
- state generation time;
- confidence;
- data freshness;
- engine version;
- supporting evidence IDs.

---

# 18. Application architecture refactor

## 18.1 Current risk

The existing `App.tsx` currently handles:

- state;
- local persistence;
- sync;
- imports;
- exports;
- engine orchestration;
- decision logging;
- rendering.

This should be decomposed before adding major v2 behaviour.

## 18.2 Proposed modules

```text
src/
├── app/
│   ├── AerionApp.tsx
│   ├── AerionProvider.tsx
│   └── routes.ts
│
├── state/
│   ├── useAerionState.ts
│   ├── athleteStateStore.ts
│   ├── evidenceStore.ts
│   └── migrations.ts
│
├── orchestration/
│   ├── buildAthleteState.ts
│   ├── buildTrajectory.ts
│   ├── buildScenarios.ts
│   ├── buildDecision.ts
│   └── recordOutcome.ts
│
├── engine/
│   ├── constraints/
│   ├── trajectory/
│   ├── scenarios/
│   ├── decisions/
│   ├── confidence/
│   ├── learning/
│   └── planning/
│
├── integrations/
│   ├── intervals/
│   ├── garmin/
│   ├── strava/
│   └── manual/
│
├── server/
│   ├── server.ts
│   ├── routes/
│   ├── services/
│   └── mcp/
│
└── ui/
    ├── mission-control/
    ├── training/
    ├── recovery/
    ├── trajectory/
    └── data-hub/
```

---

# 19. Server boundary

## 19.1 Remove runtime logic from Vite config

Vite should remain a build and development tool.

The following should move into a dedicated local server module:

- Intervals.icu requests;
- caching;
- sync receipts;
- briefing construction;
- MCP context;
- state rebuild endpoints;
- later Garmin and Strava connections.

## 19.2 Proposed endpoints

```text
GET  /api/state
GET  /api/trajectory
GET  /api/decision/today
GET  /api/plan
GET  /api/data-health

POST /api/sync
POST /api/check-in
POST /api/decision/:id/accept
POST /api/decision/:id/alternative
POST /api/state/rebuild
```

## 19.3 Local-first persistence

Move gradually from browser-only localStorage to a versioned local database.

Recommended direction:

- SQLite for canonical data;
- localStorage only for ephemeral UI preferences;
- JSON export for backups;
- append-only decision and outcome history.

Suggested tables:

```text
evidence
activities
wellness
races
goals
athlete_states
trajectories
decisions
scenarios
decision_outcomes
subjective_checkins
engine_versions
sync_receipts
```

---

# 20. Mission Control

## 20.1 Primary screen

Mission Control should be the default operating screen.

It should answer:

- What should I do today?
- Why?
- How certain is this?
- What happens next?
- Am I on track?

## 20.2 Proposed layout

```text
AERION

MISSION
Amsterdam Marathon · Sub 3
81 days remaining

TODAY’S DECISION
12 km easy
HR 138–145
Estimated duration 65–72 min

CONFIDENCE
High

WHY
Yesterday’s actual load exceeded plan.
Threshold work is protected for Friday.
Recovery supports aerobic volume.

TRAJECTORY
On track

PRIMARY LIMITER
Marathon durability

NEXT KEY SESSION
Friday · 4 × 2 km threshold

WHAT CHANGES THIS DECISION
Pain above 3/10
Sleep below 5 hours
Resting HR materially elevated
```

## 20.3 Secondary screens

- Plan
- Performance
- Recovery
- Trajectory
- Goal readiness
- Decision history
- Data Hub
- Methodology
- Expert cockpit

---

# 21. Decision audit trail

Every decision should be reproducible.

```ts
type DecisionTrace = {
  decisionId: string;
  engineVersions: Record<string, string>;
  athleteStateId: string;
  trajectoryId: string;
  scenarioIds: string[];
  selectedScenarioId: string;
  appliedConstraintIds: string[];
  evidenceIds: string[];
  generatedAt: string;
};
```

This enables:

- debugging;
- trust;
- comparing predictions with outcomes;
- safe engine improvements;
- retrospective coaching analysis.

---

# 22. Testing strategy

## 22.1 Unit tests

All pure engines:

- state generation;
- constraint application;
- trajectory;
- scenario scoring;
- decision selection;
- confidence;
- planning;
- learning updates.

## 22.2 Contract tests

For every integration:

- Intervals activity mapping;
- wellness mapping;
- race-event mapping;
- source deduplication;
- missing and malformed values;
- unit assumptions;
- freshness.

## 22.3 Golden decision tests

Create fixed athlete scenarios and record expected decisions.

Example:

```text
Scenario:
- race tomorrow
- sleep normal
- HRV normal
- threshold workout planned

Expected:
- recovery session
- threshold moved
- race freshness protected
```

## 22.4 Outcome tests

Validate that actual completed work changes tomorrow’s state and plan correctly.

## 22.5 MCP tests

Test:

- tool discovery;
- structured responses;
- no secrets;
- read-only boundaries;
- invalid input;
- missing data;
- engine version exposure.

---

# 23. Implementation phases

## Phase 0 — Baseline the current project

Objective: create a stable v1 checkpoint.

Actions:

- commit current modified and untracked files;
- remove the hardcoded manual activity injection;
- verify all existing tests;
- document current runtime;
- tag the baseline.

Suggested tag:

```text
v1-local-control
```

## Phase 1 — Clean data boundary

Objective: establish one trusted input layer.

Actions:

- introduce EvidenceRecord;
- make integration dedupe canonical;
- add source freshness;
- add sync receipts;
- separate fixture mode from live mode;
- remove duplicate context-building logic.

## Phase 2 — Canonical Athlete State

Objective: create one current truth.

Actions:

- introduce CanonicalAthleteState;
- migrate existing CurrentState logic;
- include confidence and freshness;
- add versioned state snapshots;
- expose through API and MCP.

## Phase 3 — Refactor application orchestration

Objective: remove `App.tsx` as bottleneck.

Actions:

- create state hooks;
- create derived-state orchestration;
- move imports and sync into services;
- simplify React shell;
- add startup and persistence tests.

## Phase 4 — Dedicated local server

Objective: create a durable runtime boundary.

Actions:

- move Vite middleware to server module;
- add caching;
- add testable route handlers;
- connect Electron to the new server;
- make MCP use shared server outputs.

## Phase 5 — Trajectory and Confidence

Objective: move from current-state advice to goal-aware direction.

Actions:

- build Trajectory Engine;
- build Confidence Engine;
- show primary limiter;
- show next validation session;
- expose uncertain and missing evidence.

## Phase 6 — Decision Engine v2

Objective: compare scenarios and select one structured decision.

Actions:

- generate candidate scenarios;
- apply hard and soft constraints;
- score trade-offs;
- return structured decision;
- create decision audit trace.

## Phase 7 — Rolling marathon planner

Objective: manage the Amsterdam sub-3 mission.

Actions:

- create session roles;
- protect key sessions;
- recalculate weekly plan;
- adapt to actual work;
- implement taper protection;
- add marathon readiness dimensions.

## Phase 8 — Learning Engine

Objective: personalise AERION to Dennis.

Actions:

- record predictions;
- record actual recovery;
- calculate prediction errors;
- calibrate athlete-specific multipliers;
- track response to volume and intensity.

## Phase 9 — Mission Control

Objective: make the decision the centre of the product.

Actions:

- redesign home screen;
- reduce top-level telemetry;
- surface decision, reason, trajectory and confidence;
- move detailed charts behind secondary screens.

---

# 24. Immediate next sprint

## Sprint objective

Create a stable architectural foundation without changing the visible product significantly.

## Sprint tasks

### AERION-201 — Baseline current repository

- inspect all modified and untracked files;
- commit current working state;
- create baseline tag;
- ensure tests pass.

### AERION-202 — Remove hardcoded actual activity

- remove `manual-20260430-sort-like-activity` from runtime;
- migrate it to fixtures only if still needed;
- add regression test.

### AERION-203 — Canonical dedupe

- replace app-level `mergeActivitiesById()` usage;
- make integration dedupe canonical;
- document source precedence;
- add import and sync merge tests.

### AERION-204 — Freshness semantics

- add timestamps and freshness calculation;
- prevent stale recovery red from permanently dominating;
- expose freshness in Data Hub;
- add stale-data tests.

### AERION-205 — Extract server services

- move Intervals fetching out of `vite.config.ts`;
- create testable sync service;
- create testable briefing service;
- retain Vite as thin development wrapper.

### AERION-206 — Shared MCP context

- make MCP consume shared briefing/state service;
- remove independent fixture-context construction;
- add MCP tool tests.

### AERION-207 — Introduce AthleteState v2 draft

- define new canonical type;
- map current state into draft model;
- expose read-only debug output;
- do not yet replace all current engines.

---

# 25. Definition of done for v2 foundation

The foundation phase is complete when:

- there is one canonical evidence path;
- there is one canonical athlete state;
- all state fields have freshness semantics;
- all engines consume the same athlete state;
- Vite no longer owns core runtime logic;
- MCP and UI consume the same generated outputs;
- completed activities reliably trigger recalculation;
- every decision has evidence and an audit trace;
- all foundational flows have automated tests.

---

# 26. North-star user experience

Every morning Dennis opens AERION and sees:

> **Today: 14 km easy, HR 138–145.**
>
> Your recovery supports aerobic volume but not threshold work. Yesterday’s run produced more load than expected, and Friday’s marathon-specific session has greater long-term value.
>
> **Amsterdam trajectory:** on track  
> **Primary limiter:** marathon durability  
> **Decision confidence:** high  
> **Next reassessment:** after today’s activity sync

After the run:

> **Actual completed work received.**
>
> You ran 14.8 km instead of 14 km, with stable heart rate and low drift. Recovery cost was slightly lower than predicted. Friday’s session remains unchanged. Your aerobic durability estimate has improved.

That closed loop is the defining AERION experience.

---

# 27. Final architectural principle

AERION must not optimise individual workouts.

It must optimise the athlete’s trajectory.

```text
The best workout today
is not necessarily
the hardest workout possible,
the workout originally planned,
or the workout the athlete prefers.

It is the workout that creates
the best expected path
toward the active goal,
given the athlete’s actual state,
constraints and uncertainty.
```
