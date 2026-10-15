# AERION V3 — Product and visual design contract
**Status:** Owner-authorized direction; implementation pending source reconciliation and visual acceptance.  
**Date:** 2026-10-15  
**Product authority:** `refactor/v2-foundation` pending AERION-001.  
**Brand source:** [PR #2](https://github.com/dennisariens/endurance-engine/pull/2), `codex/aerion-brand-lock-v1/docs/brand/aerion-v1/` (approved Candidate B identity, not merged).

## 1. Product definition
AERION is a calm, sophisticated and scientifically accountable endurance-coaching operating system. Internal creative briefing: **F1 engineering × elite endurance coaching × JARVIS intelligence**. Behavior: **Reality > Plan.**

Use Breakaway for UX *principles* (clear advice, disciplined hierarchy, elegant progression, no clutter), and Rapha/MAAP/EF sport/editorial restraint. ECRO supplies reference energy only. **Do not copy source layouts, visual assets or components.** The user explicitly rejected a generic AI-style app dashboard.

The existing React/TypeScript/Vite/Electron app, its engines and current data contract are the foundation, not disposable scaffolding. Do not create a second competing app.

## 2. Brand requirements (approved)
- Use the **integrated AE Candidate B vector** from PR #2, never the old generated AI / AK monogram, never a tracing of a screenshot.
- Canonical shape: `docs/brand/aerion-v1/assets/AE-B-master-black.svg`; production-colour mark: `AE-B-gradient.svg`; premium editorial treatment: `AE-B-satin.svg`. These paths stay identical.
- Vertical yellow/lime → pink → blue/cyan through the symbol (top to bottom). Use `gradient-tokens.json` exact values, not estimated colours from the imagery.
- App icon uses actual exported assets only after native-size validation and owner's review. Install into Electron only in an explicit scoped implementation PR.
- Dark navy/graphite default, accessible light mode, crisp typography. The logo gradient is **not** an all-purpose panel fill.
- Semantic colours for danger/recovery/fatigue/success are independent from logo colours. Never encode injury as a decorative pink/blue/yellow alone.
- Use restrained pink for primary calls to action, blue/cyan for selected charts/telemetry, lime/yellow sparingly for focus or momentum where not ambiguous. Emphasize readable contrasts.
- Photography optional on editorial/goal pages, **not mandatory** on everyday Home; no stock-image dependency. No athletes/sports silhouettes inside the icon.

## 3. Experience rules
- Core question: **What should I do today, why, and what happens next?**
- One major coaching recommendation on Home, not huge repeated slogan typography.
- A straightforward path from Home to activity history, next 72 hours, primary goal and evidence.
- Use concise, human coaching language; never scold the user for training differently.
- Responsive first: desktop at 1440/1280 wide, laptop 1024, tablet ~768, mobile ~390/375; content order independent of screen.
- Fewer cards and larger meaningful content panels; no arbitrary giant type or narrow overflowing cards.
- Expand details progressively (Why this? View evidence; adjust plan); technical/debug modules behind an expert view.
- No fake metrics, fabricated freshness, optimistic progress or made-up readiness. Use explicit **not available**, **estimated** or **last synced** display where appropriate.
- No product branding borrowed verbatim from other apps. AERION name, identity and terms are independently designed.

## 4. Information architecture
Primary: **Home, Training, Performance, Goals & Races, Recovery, AI Coach**.  
Secondary: **History/Agenda, Strength, Integrations, Settings, Data & Expert**.  
This is a desired information hierarchy, **not** a command to remove existing screens or routes in the first PR.

### Home V3 specification
Above-the-fold hierarchy:
1. Compact AE product identity, date and last-sync status.
2. **Today**: one actionable recommendation, duration/intensity when sourced, status, clear *Why* and safe adjustments; no empty "what must we do" decorative column.
3. **Next 72h**: 3-column on desktop or stacked horizontal timeline on mobile; day/time, planned action, flexible/fixed/conditional states, explanation.
4. **Primary goal / race**: target + countdown only if actual goal/race data exists; stale, missing or paused explicitly stated.
5. **Evidence**: 2–4 relevant, sourced signals such as recent load, recovery, key session/limitation, with timestamp and source. Data-density increases via drilldown, not Home clutter.
6. **Coach entry**: ask a question or propose an adjustment; the app should apply only reviewable approved mutations.
7. Recent completed activity can be a compact secondary strip/entry.

Every important session must be marked **recommended / planned / fixed / conditional / completed / skipped / moved** where existing data supports it. Do not pretend the current engine already models states it does not; phase in after contracts/tests.

### Training
Adaptable calendar, completed vs planned sessions, manual modifications, source labels; flexible long-run scheduling; existing race priority. Avoid creating duplicate engine rules.

### Performance
Readable charts with clear units, trends and evidence freshness; swimming/cycling/running context if available. Distinguish configured FTP, estimated FTP, measured values. Every chart should have one takeaway.

### Goals & Races
Primary and secondary goal hierarchy, projected outcomes as ranges/assumptions, progress/limiter cards; no invented race date, predicted time or readiness.

### Recovery
Available sleep/HRV/activity load plus manually entered restrictions where authorized. Unknown is unknown. Clinical claims prohibited; recovery support is advisory.

### AI Coach
Respond based on the same derived athlete state as Home; explain "why"; use sources and confidence; never silently write training data, and never generate conflicting autonomous plan.

## 5. Current code reuse map (verified remotely)
- `src/App.tsx`: current React orchestration; uses `useAerionState`, `useAerionImports`, `useOpeningSync`, `useAerionDerivedState`.
- `src/components/PremiumCommandDeck.tsx`: present shell, screens/nav, currently rendered makeshift inline SVG (replace with approved AE vector).
- `src/components/premium/screens`: existing lazy-loaded Home, Training, Performance, Recovery, Goals, Coach and utility screens.
- `src/styles.css`: v1 tokens/styles; refactor incrementally into semantic V3 tokens, preserve light theme and legacy aliases during migration.
- `src/engine/coachBriefingEngine.ts`, `src/engine/recoveryPlanEngine.ts`, `src/engine/dailyRecommendationEngine.ts`, `src/engine/morningReadinessEngine.ts`: reuse and test, no broad rewriting until source audit.
- `scripts/aerion-briefing-context.mjs` fetches `/api/briefing`: existing internal morning-context entry. Preserve and audit instead of duplicating.
- **Known specific issue:** `PremiumCommandDeck.tsx` uses `readiness?.overallReadiness ?? state.recovery_score ?? 72`. Remove fabricated `72` fallback; adjust type/UI to display unknown rather than inventing readiness. Check for similar defaults in all screens.

## 6. V3 UI components to create/refine
`AerionLogo` (canonical vector) · `AppShell` · `ScreenHeader` · `CoachingDecisionCard` · `EvidenceStrip` · `AdaptiveTimeline` · `GoalProgressPanel` · `Metric` · `LastSynced` · `EmptyState` · `LoadingState` · `SourceBadge` · `ActionButton`.

Components are domain-aware presentation only; pure coaching logic stays under existing engines. Adapt existing components instead of creating equivalents where feasible.

## 7. Design review requirements
Deliver genuine, locally rendered screenshots of the runnable app, not generated concept art masquerading as production:
- Desktop Home (1440 × 900 or comparable), mobile Home (~390 × 844)
- One secondary screen desktop + mobile (Training or Performance)
- Light-mode proof; no horizontal overflow or clipping
- Comparison against approved AERION V3 design intent and exact AE brand asset
- Interaction demonstrations: navigation, Why, plan adjustments, source/freshness, missing data, activity/goal drilldown
- Accessibility: contrast, keyboard focus, hit targets, reduced motion
- Confirm no secrets/health-sensitive screenshots appear in public PR

## 8. Non-goals for the first PR
Do not replace the backend, rewrite the coaching engines, build a new auth provider, claim Garmin/Strava OAuth, migrate the database, install a production icon, reset local data, enable third-party analytics, force a merge or deploy.

## 9. Mandatory acceptance gates
1. **Source reconciliation:** Hermes inventories live Mac working tree without mutation; Work reviews differences vs GitHub.
2. **Brand gate:** PR #2 assets match owner-approved AE geometry and gradient; no accidental new A/E.
3. **Home gate:** real app screenshot + verified functional flow + realistic missing-data/health states, no fabricated metrics.
4. **App gate:** `npm test`, `npm run typecheck`, `npm run build`; report SQLite environment failures separately, do not delete tests to pass.
5. **Owner gate:** explicit approval before replacing running app icon, merging, deploying or changing live local install.

## 10. Decision authority
AERION Main = brand/product direction and acceptance. AERION Work = coordinator, reviewer, implementation owner. Codex = scoped code/test work. Hermes = local Mac/runtime safety, inventory, screenshot/testing and integration assistance. Coaching = separate private training context, not a public GitHub data feed.
