---
version: alpha
name: AERION Design System v1
description: Premium endurance operating-system design tokens for AERION; BRAND.md-derived Breakaway-style translation with deep navy, white, coral/pink action accents, restrained cyan telemetry, readiness semantics, and reusable command/metric/evidence hierarchy.
colors:
  primary: "#081125"
  secondary: "#9FB0C9"
  tertiary: "#FF4F8B"
  neutral: "#F5F7FB"
  surfaceVoid: "#050914"
  surfaceNavy: "#0D1830"
  surfacePanel: "#10203D"
  surfaceRaised: "#172A4F"
  textPrimary: "#F5F7FB"
  textSecondary: "#D7DEEC"
  textMuted: "#9FB0C9"
  textInverse: "#06101A"
  borderDefault: "#293548"
  borderSoft: "#202B3D"
  accentIce: "#F5F7FB"
  accentCyan: "#7DD3FC"
  accentBlue: "#4FB7FF"
  accentViolet: "#B7A6FF"
  accentAmber: "#FFB86B"
  accentCoral: "#FF4F8B"
  readinessClear: "#55D997"
  readinessHold: "#FFCF72"
  readinessExtend: "#FF5F7E"
  readinessInjury: "#A78BFA"
  chartGrid: "#25314A"
  chartAxis: "#9FB0C9"
typography:
  display:
    fontFamily: Barlow Condensed / DIN Condensed / Avenir Next Condensed
    fontSize: 112px
    fontWeight: 760
    lineHeight: 0.74
    letterSpacing: "-0.035em"
  h1:
    fontFamily: Barlow Condensed / DIN Condensed / Avenir Next Condensed
    fontSize: 88px
    fontWeight: 780
    lineHeight: 0.82
    letterSpacing: "-0.025em"
  h2:
    fontFamily: Barlow Condensed / DIN Condensed / Avenir Next Condensed
    fontSize: 56px
    fontWeight: 760
    lineHeight: 0.86
    letterSpacing: "-0.02em"
  kpi:
    fontFamily: Barlow Condensed / DIN Condensed / Avenir Next Condensed
    fontSize: 44px
    fontWeight: 740
    lineHeight: 0.84
    letterSpacing: "-0.015em"
  body:
    fontFamily: SF Pro Text / system
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  body-sm:
    fontFamily: SF Pro Text / system
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "0em"
  label:
    fontFamily: SF Pro Text / system
    fontSize: 10px
    fontWeight: 720
    lineHeight: 1.2
    letterSpacing: "0.18em"
  numeric:
    fontFamily: SF Mono / ui-monospace
    fontSize: 56px
    fontWeight: 700
    lineHeight: 0.85
    letterSpacing: "-0.08em"
rounded:
  sm: 12px
  md: 16px
  lg: 22px
  xl: 28px
  pill: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
components:
  app-shell:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.textPrimary}"
  sidebar:
    backgroundColor: "{colors.surfaceVoid}"
    textColor: "{colors.textSecondary}"
    padding: 20px
  panel-base:
    backgroundColor: "{colors.surfacePanel}"
    textColor: "{colors.textPrimary}"
    rounded: "{rounded.lg}"
    padding: 18px
  panel-raised:
    backgroundColor: "{colors.surfaceRaised}"
    textColor: "{colors.textPrimary}"
    rounded: "{rounded.xl}"
    padding: 24px
  nav-active:
    backgroundColor: "{colors.surfacePanel}"
    textColor: "{colors.accentIce}"
    rounded: "{rounded.sm}"
    padding: 12px
  nav-idle:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.textMuted}"
    rounded: "{rounded.sm}"
    padding: 12px
  readiness-clear:
    backgroundColor: "{colors.surfacePanel}"
    textColor: "{colors.readinessClear}"
    rounded: "{rounded.pill}"
    padding: 8px
  readiness-hold:
    backgroundColor: "{colors.surfacePanel}"
    textColor: "{colors.readinessHold}"
    rounded: "{rounded.pill}"
    padding: 8px
  readiness-extend:
    backgroundColor: "{colors.surfacePanel}"
    textColor: "{colors.readinessExtend}"
    rounded: "{rounded.pill}"
    padding: 8px
  command-panel:
    backgroundColor: "{colors.surfacePanel}"
    textColor: "{colors.textPrimary}"
    rounded: "{rounded.xl}"
    padding: 32px
  metric-tile:
    backgroundColor: "{colors.surfacePanel}"
    textColor: "{colors.textPrimary}"
    rounded: "{rounded.lg}"
    padding: 14px
  evidence-strip:
    backgroundColor: "{colors.surfacePanel}"
    textColor: "{colors.textSecondary}"
    rounded: "{rounded.lg}"
    padding: 14px
---

# AERION Design System v1

## Overview

AERION is an endurance control system, not a generic dashboard. The interface should feel like a premium operating layer for training, racing, recovery, and reality-based recalculation.

The active product style contract lives in `BRAND.md`. It translates Breakaway-like endurance-app discipline into AERION's own colder race-control language. Use the underlying behavior — large answer-first type, sparse dark rhythm, route/progress motif, one restrained action accent, app-like proof panels — without copying Breakaway's brand.

The visual language is dark-first, precise, restrained, and telemetry-oriented. It borrows the confidence and simplicity of premium endurance apps while staying colder, more technical, and more operational than a friendly coaching app.

Core principles:

- one clear decision before deeper analysis,
- actual completed work is authoritative,
- readiness states are clear but not theatrical,
- charts are high-signal and quiet,
- panels feel intentional, not randomly carded,
- no neon gamer look,
- no guilt copy,
- no decorative clutter.

## Brand contract

Reference behavior:

- one dominant answer per screen,
- dark navy athletic surface,
- large condensed display type,
- sparse modular rhythm,
- route/progress motif instead of generic icon decoration,
- coral/pink action signature,
- cyan as instrumentation only,
- no equal-weight dashboard card wall.

AERION components that carry this contract:

- `CommandPanel`: first-screen answer object.
- `MetricTile`: custom KPI replacement.
- `RouteRail`: AERION route/progress motif.
- `EvidenceStrip`: compact source/why/action proof.

## Colors

Semantic layers:

- **Base / void:** `#03060B` and `#070B12` for the app shell and cinematic depth.
- **Navy surface:** `#081125` keeps AERION athletic and less flat than pure black.
- **Panel surfaces:** `#0B1220` and `#101827` separate product panels from the page without SaaS-card noise.
- **Text:** `#E5EEFC` primary, `#CBD5E1` secondary, `#94A3B8` muted.
- **Primary accent:** cyan / ice-blue (`#38BDF8`, `#7DD3FC`) for active navigation, key traces, and primary system focus.
- **Readiness:** green clear, amber hold, rose/red extend, violet injury/exception.
- **Charts:** use a dedicated palette; do not invent one-off line colors per chart.

Readiness colors should communicate state, not blame. Use colored borders/traces before filled alarm surfaces.

## Brand mark

The in-app mark must match the macOS app icon language:

- dark rounded tile,
- diagonal speed stripes,
- telemetry ring,
- sharp A mark,
- ice / white / graphite palette.

Do not use a generic letter-in-circle badge. If the icon evolves, update the sidebar SVG and packaged macOS icon together.

## Typography

Use a macOS-native premium stack: SF Pro Text for UI/body and Avenir Next / SF Pro Display for display, headings, and KPI objects. The hierarchy carries the premium feel through weight, scale, and controlled negative tracking.

- Display/Hero: large, compressed, confident.
- Page h1/h2: tight line-height, strong weight.
- KPI values: large and sharp; the number/decision is the object.
- Labels: small uppercase with generous tracking.
- Body: calm 14–16px explanatory text.

Avoid random web-font experiments until the product structure is stable.

## Layout

AERION uses a paginated product shell:

- left sidebar for navigation,
- focused Home / Mission Control,
- deeper screens for Performance, Races, Training, Recovery, Goals, AI Coach, Settings/Data,
- collapsed expert/debug cockpit below the premium shell.

Spacing should create operational calm. Prefer fewer, stronger panels over many equal-weight cards.

Home must answer within five seconds:

- can I train today,
- can I race soon,
- am I recovering or digging a hole,
- what changed,
- what is the next critical event,
- what should I protect in the next 72h.

## Elevation & Depth

Depth is created by:

- dark-on-darker surface layers,
- thin low-opacity borders,
- inset highlights,
- soft radial ambient light,
- restrained chart glows only where useful.

Do not use heavy SaaS shadows or colorful gradients everywhere.

Elevation hierarchy:

1. App shell: deepest background.
2. Sidebar: fixed operational chrome.
3. Screen panel: large page container.
4. Base panel/card: KPIs, charts, coach blocks.
5. Raised panel: rare focus state or critical summary.

## Shapes

- Small controls: 12px radius.
- Standard panels: 16–22px radius.
- Major screen containers: 28px radius.
- Pills/status badges: 999px.

Use large radii sparingly. The system should feel premium, not bubbly.

## Components

### Navigation

Navigation states:

- idle: muted text, transparent surface,
- hover: subtle glass surface,
- active: ice text, low-opacity cyan background, active border.

Icons should support scanning, not decorate every sentence.

### Panels and cards

Use a shared panel recipe: thin border, dark glass surface, subtle inset highlight. KPI cards, chart cards, race cards, timeline blocks, and coach cards should feel related.

### Readiness states

- Clear: green, permission with restraint.
- Hold: amber, cap optional work.
- Extend: rose/red, recovery-first.
- Injury/illness: violet/exception, override normal race logic.

State color should primarily affect border, small label, chart trace, or orb progress. Avoid fully flooding panels unless the action is truly critical.

### Telemetry graphs

Graph rules:

- dark panel background,
- no heavy axes,
- low-opacity grid only,
- small muted ticks,
- 2px traces,
- sparse dots or no dots,
- limited series count,
- tooltips use dark surface and border,
- every series color comes from the chart palette.
- chart shells show the available data fields as chips,
- chart-specific field selections are persisted locally,
- filters/options must change the visible data, not just decorate the chart.

Chart palette:

- CTL: ice
- ATL: amber
- TSB: violet
- race cost: cyan
- drift/risk: rose
- durability/recovery: green
- cumulative load: slate

### Account and Data Hub

The Data Hub owns account, connection, import/export, and source trust controls.

Rules:

- account state is local-first and persisted,
- do not fake cloud authentication before a backend exists,
- connection buttons must call a real local flow or clearly stay disabled,
- Intervals sync uses the server-side `/api/sync` boundary,
- Garmin recovery import uses JSON snapshots behind `garminRecoveryAdapter`,
- Strava activity proof import uses JSON exports behind `stravaActivityProofAdapter`,
- no browser-visible API keys or OAuth tokens.

## Do's and Don'ts

Do:

- make the main recommendation dominant,
- reuse semantic tokens before adding new colors,
- use readiness colors consistently,
- keep the product shell calm,
- preserve expert/debug depth without putting it on Home,
- keep chart styling quiet and legible.

Don't:

- redesign all screens at once,
- overanimate,
- add random gradients,
- introduce one-off card styles,
- make every metric visually equal,
- use guilt language,
- turn AERION into generic SaaS.
