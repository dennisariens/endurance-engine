# Endurance Dashboard Implementation Plan

> For Hermes: Use subagent-driven-development skill to implement this plan task-by-task.

Goal: Build a local-first web dashboard for fixed-race endurance decisioning.

Architecture: React/TypeScript dashboard backed by local JSON files and pure decision-engine modules. Intervals.icu remains a sync input, not a hard runtime dependency.

Tech Stack: Vite, React, TypeScript, Tailwind, Recharts, Vitest.

---

## Milestone 0 — Repo Setup

### Task 1: Create frontend scaffold

Files:
- Create `package.json`
- Create `src/main.tsx`
- Create `src/App.tsx`
- Create `src/styles.css`

Verification:
- `npm install`
- `npm run dev`
- Browser opens dashboard shell

### Task 2: Add domain types

Files:
- Create `src/domain/types.ts`

Verification:
- `npm run typecheck`

### Task 3: Add fixture data

Files:
- Create `data/races.json`
- Create `data/activities.json`
- Create `data/current-state.json`

Verification:
- dashboard can import/read fixture data

## Milestone 1 — Engine Core

### Task 4: Race block detection

Files:
- Create `src/engine/calendarEngine.ts`
- Create `src/engine/calendarEngine.test.ts`

Tests:
- 2 races within 72h => race block
- 3 races within 7 days => race block
- single race => no block

### Task 5: Race cost engine

Files:
- Create `src/engine/raceCostEngine.ts`
- Create `src/engine/raceCostEngine.test.ts`

Tests:
- low/medium/high/extreme bands
- fixed race cost never blocks future fixed race by itself

### Task 6: Decision engine

Files:
- Create `src/engine/decisionEngine.ts`
- Create `src/engine/decisionEngine.test.ts`

Tests:
- race today + no injury => Race
- race today + fatigue red => DamageControl
- race today + injury => Rest / blocked
- no race + high race cost => RecoveryOptimization

## Milestone 2 — Dashboard MVP

### Task 7: Today card

Files:
- Create `src/components/TodayCard.tsx`

### Task 8: Next race card

Files:
- Create `src/components/NextRaceCard.tsx`

### Task 9: Race cost card

Files:
- Create `src/components/RaceCostCard.tsx`

### Task 10: Calendar view

Files:
- Create `src/components/CalendarView.tsx`

### Task 11: Add/edit modal mock

Files:
- Create `src/components/EventModal.tsx`

## Milestone 3 — Local Data Sync

### Task 12: Convert brain race calendar to JSON fixture

Files:
- Create `scripts/import-races-from-yaml.ts`

### Task 13: Read Intervals snapshot

Files:
- Create `scripts/import-intervals-snapshot.ts`

## Milestone 4 — GitHub Prep

### Task 14: Add README and screenshots placeholder

### Task 15: Initialize GitHub repo after name decision

Commands:
- `gh repo create <name> --private --source=. --remote=origin --push`

Do not create public repo until Dennis approves name and visibility.
