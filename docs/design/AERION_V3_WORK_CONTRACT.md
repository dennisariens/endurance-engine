# AERION V3 — Work design and integration contract

Date: 2026-10-16. Owner direction: issue #3 and planning PR #7. Work task: #5.
Status: P1 implementation specification prepared and reviewed against remote code. P0 local-source gate remains BLOCKED; this document does not commission P2 or claim a running Home V3.

## Verified sources and gate ledger

| Gate | Evidence | Status |
| --- | --- | --- |
| Product source | refactor/v2-foundation at 56ddc1d107b40f2bd880decae3a6264bbcd00717 | Remote source inspected; Mac equivalence unknown |
| Planning | PR #7 at 82e93d8c8c0d596aac1b7d60d2bcf7135f2d1fd6 | Product Brief, Relaunch Roadmap and Execution Handoff read |
| Identity | PR #2 at 78bfed9821f3b04941f945cf805b251a52303a39 | All 37 manifest file hashes match; canonical geometry retained |
| Hermes P0 | Issue #4 request posted; no response at intake | BLOCKED: no Mac checkout/runtime evidence |
| Work P1 | This contract plus tokens and acceptance matrix | Specification ready; actual-screen visual proof deferred to P2 |
| Codex P2 | Issue #6 | NOT commissioned until P0/P1 release note |

The Mac runtime, real before screenshots and local changes are not available to this session. GitHub comments queue work; they do not prove Hermes has started. The owner has already authorized scoped application development; no repeat permission request is needed for P0/P1. No merge, install or deployment is authorized.

## Brand integration

Use the exact `AE-B-gradient.svg` from the pinned brand commit. Copy that file into `src/assets/brand/` on the eventual implementation branch; retain its original file hash in an asset provenance note. Use one shared AerionLogo presentation component with an accessible name and aspect ratio 681:337. Do not trace, reshape or independently simplify it. Prefer a 48–56 px wide symbol in the app header; the 16–32 px app exports remain device-QA candidates, not a new geometry brief.

Use monochrome where contrast requires it. Native app/ICNS installation stays out of P2. The official logo's seven-stop vertical gradient is reserved for the logo; no full-panel gradients, neon glows or coloured shadows. UI typography is not the logo wordmark; no substitute typeface should be presented as a new locked wordmark.

## Visual system

Companion `AERION_V3_TOKENS.json` specifies opaque colours for reliable contrast. Use existing semantic CSS token names and legacy aliases during migration; scope new layout rules to V3. Avoid another trailing stylesheet override stack.

| Role | Dark | Light | Behaviour |
| --- | --- | --- | --- |
| Canvas | #090D13 | #F4F6F8 | Quiet background |
| Surface | #10151D | #FFFFFF | Primary reading plane |
| Raised | #18212D | #E9EEF3 | Controls/secondary details |
| Main text | #F4F7FA | #14202C | Body, headings |
| Secondary text | #A9B7C8 | #506174 | Explanations; no faint essential copy |
| Primary action | #FF8FBA | #A51555 | Dark label #10151D / white label #FFFFFF |
| Telemetry/link | #58C6FF | #006C9E | Charts, links and selection; never a health verdict |
| Focus | #F0FF6B | #725500 | Keyboard outline with 2 px offset |
| Positive | #69DBA0 | #176C44 | Explicit positive status plus text |
| Caution | #F2CF75 | #785600 | Caution plus text/icon |
| Restriction/error | #FF9C9C | #A32232 | Restriction/error plus text/icon |

Typography: existing system UI stack; no external font dependency. Headings use normal sentence case, weight 600, -0.02em tracking. Decision title 36/42 px desktop, 28/34 px mobile; screen title 24/30; section title 18/24; body 16/24; supporting text 14/20; labels 12/16. Tabular figures for metrics, no giant score orb. Use 4/8/12/16/24/32/48 px spacing, panel radius 16 px, control radius 10 px, borders rather than nested shadows. One primary filled CTA in the decision section. Minimum 44 px interactive targets. Motion 120–180 ms and disabled under reduced-motion preference.

## Home desktop contract (1440 × 900, also check 1280 and 1024)

- 208 px left navigation at >=1200 px; compact top navigation below that. Main reading width max 1120 px, centred, 32 px gutters (24 px at narrower desktop).
- Compact 64 px header: AE/AERION, date, source/sync state, settings. Screen title is Today; remove repeated Race Control / Today at a glance slogans.
- First region is one coaching decision, full width, padding 32 px. Show the actual recommendation title, sourced duration/intensity, one-sentence rationale, and explicit status. Primary button: View session. Secondary: Why this? Third text action: Ask coach. Do not render two competing versions of today's advice.
- Why expands inline beneath the recommendation, with decision reasons, limiting evidence and provenance. Expanding is read-only. No concealed change to plans or activities.
- Next 72 hours follows as one section with three equal columns and dividers. Use existing engine blocks with horizon/date/action and supported status; do not invent fixed/moved/completed state.
- Goal and evidence share a 5:7 row below the timeline. Goal is driven by activeGoal and goal readiness, not the next race or daily recovery score. Evidence contains at most four source-labelled signals and a detail link.
- Recent completed activity is one compact optional row, then coach entry. Scenario charts, customization modes and secondary navigation grids leave Home's initial reading path, but remain available via relevant screens or expert view.
- Above-the-fold goal: identity, actual Today decision and start of the 72h section at 900 px height. Never hide or clip content to force all sections into one viewport.

## Home mobile contract (390 × 844 and 375 px wide)

- 16 px page gutters; compact 56 px top identity/status bar. Header action opens integrations/source details.
- Same DOM/reading order: Today, Why, 72h, goal, evidence, recent activity. No CSS reorder that breaks keyboard reading order.
- Decision title 28 px; readable wrapped copy, buttons at least 44 px high; avoid fixed-height panels.
- 72h becomes a vertical timeline of three rows; no horizontal swipe required to discover tomorrow.
- Bottom navigation: Home, Training, Performance, Coach, More. More reveals Goals, Races, Recovery, History and Settings without removing current routes. Account for safe-area insets; body bottom padding prevents covered controls.
- No horizontal overflow at 375 px or 200% text zoom. Preserve active navigation state and keyboard focus. More dialog needs focus containment, Escape close, accessible name and focus return.

## Before/after specification (code-backed, not claimed screenshots)

| Current remote implementation | V3 contract |
| --- | --- |
| Old inline ring/A and Race OS subtitle | Canonical approved AE vector, AERION identity |
| Race Control header plus second Home headline | Compact header and one Today decision |
| Command panel plus duplicated action card | One recommendation with sourced metadata and Why |
| Coach/Mission/Data layout toggle and six quick links | Stable coaching-first order and primary navigation |
| Six dashboard panels plus six repeated metric tiles | 72h timeline, one goal panel and 2–4 evidence rows |
| Readiness orb combines goal score, recovery score and 72 | Separate recovery and goal measures; unknown stays unknown |
| History load substitutes readiness when load is zero | History load from activity evidence only; preserve valid zero |
| Humorous restriction/avoid language | Calm explanation of current constraint and safe next action |
| Training KPI grid and large slogan | A readable session detail with steps, rationale and alternatives |

## Secondary screen — Training

Desktop: compact Training title and date, one primary session detail on left (title, purpose, sourced duration/intensity/cap, ordered steps), right column for current phase and relevant constraints. Show alternative workouts only if existing recommendation data provides them. Link to existing History for completed activity. Mobile stacks session, steps, alternatives and constraints in that order.

Replace generic or sarcastic slogans with source-grounded copy. A suggested session is labelled Recommended, not Scheduled or Completed. The existing TrainingScreen is a recommendation detail, not a functioning editable calendar. Calendar editing and drag/drop remain later domain work unless actual existing handlers support them. Do not add dead controls.

Performance follow-on: preserve TelemetryChartShell and chart data adapters; chart headings state the measurement and unit, with takeaway and freshness. Keep configured/estimated/measured values distinguishable. Do not rebuild chart or coaching engines for styling.

## Actual reuse and data plumbing map

| Experience | Reuse | Bounded change |
| --- | --- | --- |
| Shell/navigation | PremiumCommandDeck.tsx, ScreenId, lazy screen imports, aerion:navigate event | New layout, canonical logo, mobile More; retain all route IDs and desktop event |
| Today + Why | HomeScreen, recommendation, briefing, decision, dailyRecommendation | One coherent recommendation; source/provenance labels; read-only rationale |
| 72h | next72Plan, MiniTimeline, recoveryPlanEngine | Better presentation of existing blocks, no new coaching rules |
| Goal | activeGoal, readiness, path | Goal-specific estimate with confidence; no daily-recovery substitution |
| Evidence | EvidenceStrip, useAerionDerivedState freshness/integrations | Pass existing freshness through typed props; generation time is not observation time |
| Sync | useOpeningSync, SyncStatus, IntegrationHealth | Show receipt timestamp and source separately from connection status |
| Training | TrainingScreen, recommendation.primary, path | Editorial session structure and honest existing actions |
| Data changes | Existing handlers in App and PremiumCommandDeckProps | No new silent mutation pathway |

## Truthfulness defects to address in P2

1. `PremiumCommandDeck`: `readiness?.overallReadiness ?? state.recovery_score ?? 72` conflates goal and daily recovery. Removing only 72 is insufficient. Keep goal readiness separate; daily recovery gets its own labelled optional value and observation date.
2. `HomeScreen`: `dailyRecommendation.goal.readiness ?? readyScore` substitutes an unrelated measure. Use unknown when goal estimate is absent.
3. `HomeScreen`: `stats.avgRaceCost || readyScore` displays readiness as load and treats real zero as absent. Use evidence-aware load display; no cross-domain fallback.
4. `HomeScreen` scenario bars force a minimum magnitude and take absolute ranges; they are unsuitable as the main evidence view. Keep scenario exploration outside the initial Home view; do not imply zero change is positive progress.
5. `freshness` already exists in useAerionDerivedState but is not in PremiumCommandDeckProps. Pass it through instead of independently inventing a second stale-data policy. Its race-date signal is not a data-import timestamp; do not label it as source freshness.
6. `syncStatus.state === fresh` means a sync response, not that recovery observations are current or that all providers are connected. Preserve per-source date/status. An import-only provider is not OAuth-connected.
7. Audit defaults upstream of presentation: missing raw evidence can yield derived strings/numbers. If provenance cannot be established, show unavailable or clearly labelled model estimate, never an invented measurement. Do not change engine semantics without tests and explicit scope.

## Required product states and interactions

| Case | Required result |
| --- | --- |
| No source evidence / no recovery | No numeric readiness, no green verdict inferred from absence; actionable connect/import entry |
| Legitimate zero | Render zero with unit/source, not Off or unrelated fallback |
| Stale import | Show observation date and stale badge; sync receipt does not refresh it |
| Syncing / error / offline | Distinct text; preserve available local evidence and retry via existing handler |
| No goal / past goal / no race | Explicit absence/elapsed state; never borrow a date or invented countdown |
| Generic restriction | Clear constraint and existing safe recommendation; no sarcasm or clinical certainty |
| Why / evidence | Expand actual reasons; close restores focus; no state mutation |
| View session / goal / activity | Navigate to actual existing destination; no dead buttons |
| Ask coach / adjustment | Reuse current coach entry; suggestions remain reviewable, no automatic writes |

## Verification and screenshot contract

P2 must include meaningful regression tests for absent readiness, valid zero, stale observations after fresh sync, goal/recovery separation, no-evidence default values and untouched mutation callbacks. Keep existing engine tests. Run `npm test`, `npm run typecheck`, `npm run build`; do not delete failing SQLite tests. Previous environment result was 160/164 passing, four `sqlite3 ENOENT`, with typecheck/build passing; these are historical checks, not new P2 results.

Capture real pre-change and post-change app renders from the verified source baseline with the same approved, explicitly synthetic, public-safe QA data or empty state. No production fixture changes. Desktop Home 1440×900, mobile Home 390×844, 375 px overflow check, desktop/mobile Training, light mode, unknown and stale states. Label remote-source captures separately from Mac-runtime captures. Never publish personal training/health data, credentials, or private screenshots. Include keyboard/focus, More navigation, Why, source freshness, navigation and reduced-motion results.

Discrepancy report columns: requirement, actual result, evidence filename/viewport, severity, fix or deferred scope. Every screenshot must identify source SHA, data mode and theme. Report pending items plainly. No generated concept imagery may be labelled a running app.

## P0 release and Codex commissioning procedure

Hermes must supply source HEAD/branch, sanitized status and ahead/behind classification, local-only source differences, runtime/build evidence, and preservation plan. Work reviews that evidence and explicitly records whether the verified remote SHA is sufficient or a protected local-source branch is required. Do not assume an empty GitHub issue means a clean Mac checkout.

After P0 is accepted, Work posts a release note on #6 containing exact base SHA, base branch, approved contract SHA, pinned brand SHA, and list of allowed paths. Branch naming: `codex/aerion-v3-home`. Import only exact approved assets from PR #2 by path; do not merge either planning or brand PR automatically. Keep source reconciliation, UI implementation and native packaging distinct.

First Codex delivery: runnable existing-app shell + Home and bounded Training presentation, truthful missing/stale data, screenshots/comparison/report and verified tests. A protected source baseline and runnable review must precede any merge/install decision.
