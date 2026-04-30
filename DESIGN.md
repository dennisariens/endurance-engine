---
version: alpha
name: AERION
description: Precision endurance control system for fixed-race athletes. Dark, calm, tactical, data-first.
colors:
  background: "#070B12"
  surface: "#0F172A"
  surfaceRaised: "#111C31"
  border: "#1E293B"
  text: "#E5EEFC"
  textMuted: "#94A3B8"
  primary: "#38BDF8"
  success: "#22C55E"
  warning: "#FACC15"
  danger: "#EF4444"
  dangerSurface: "#7F1D1D"
  injury: "#A855F7"
  injurySurface: "#581C87"
  recovery: "#94A3B8"
  white: "#FFFFFF"
typography:
  display:
    fontFamily: Inter
    fontSize: 4.5rem
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.05em"
  h1:
    fontFamily: Inter
    fontSize: 3rem
    fontWeight: 750
    lineHeight: 1
    letterSpacing: "-0.04em"
  h2:
    fontFamily: Inter
    fontSize: 1.75rem
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  body:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.12em"
rounded:
  sm: 8px
  md: 14px
  lg: 24px
  xl: 32px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  page: 56px
components:
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: 24px
  card-muted:
    backgroundColor: "{colors.border}"
    textColor: "{colors.textMuted}"
    rounded: "{rounded.lg}"
    padding: 24px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.background}"
    rounded: "{rounded.md}"
    padding: 12px
  button-danger:
    backgroundColor: "{colors.dangerSurface}"
    textColor: "{colors.white}"
    rounded: "{rounded.md}"
    padding: 12px
  status-green:
    backgroundColor: "{colors.success}"
    textColor: "{colors.background}"
    rounded: "{rounded.sm}"
    padding: 8px
  status-yellow:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.background}"
    rounded: "{rounded.sm}"
    padding: 8px
  status-red:
    backgroundColor: "{colors.dangerSurface}"
    textColor: "{colors.white}"
    rounded: "{rounded.sm}"
    padding: 8px
  danger-accent:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.background}"
    rounded: "{rounded.sm}"
    padding: 8px
  status-injury:
    backgroundColor: "{colors.injurySurface}"
    textColor: "{colors.white}"
    rounded: "{rounded.sm}"
    padding: 8px
  injury-accent:
    backgroundColor: "{colors.injury}"
    textColor: "{colors.background}"
    rounded: "{rounded.sm}"
    padding: 8px
  status-recovery:
    backgroundColor: "{colors.recovery}"
    textColor: "{colors.background}"
    rounded: "{rounded.sm}"
    padding: 8px
  card-raised:
    backgroundColor: "{colors.surfaceRaised}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: 24px
---

## Overview

AERION is a precision endurance control system, not a fitness toy. The interface should feel like a race-control room: calm, dark, structured, and fast to read under fatigue.

The product exists to answer one question immediately: what should I do today, given fixed races, recent cost, and recovery state?

## Colors

- Background is near-black navy, not pure black, to keep the interface focused without harsh contrast.
- Primary cyan marks fixed races, key actions, and active data paths.
- Green/yellow/red are reserved for status. Do not use them decoratively.
- Purple is reserved for injury/illness because it means a different class of decision: race blocking.
- Muted slate is used for recovery, secondary labels, and neutral calendar blocks.

## Typography

Use Inter everywhere. Keep the hierarchy sharp: large compressed headlines, small uppercase labels, readable body text.

Numbers matter. Metrics should use large, confident type with short labels. Do not bury status inside paragraphs.

## Layout

Use a dashboard grid with strong cards and generous spacing. Primary cards should fit above the fold:

1. Today status
2. Next race
3. Latest race cost
4. Recovery state
5. Aerobic engine / Z2 status

Calendar sits below or beside the metric grid depending on viewport width.

## Elevation & Depth

Minimal depth. Use borders, subtle contrast, and status color accents. Avoid glassmorphism, noisy gradients, and muddy overlays.

## Shapes

Rounded cards, precise controls. Use 24px card radius, 14px control radius, and 8px compact pills.

## Components

Cards should be dense but breathable. Each primary card needs:

- label
- main value
- one-line interpretation
- optional small warning/action

Calendar events should be visually distinct:

- fixed race: cyan
- optional activity: neutral slate
- blocked date: purple/red depending reason
- recovery day: slate
- Z2 day: green outline
- strength/core: amber or neutral, never stronger than race events

## Do's and Don'ts

Do:
- Show the decision first.
- Keep race calendar constraints visible.
- Use status colors consistently.
- Make mandatory race vs injury block unmistakable.
- Prefer crisp flat colors.

Don't:
- Add motivational clutter.
- Use generic wellness gradients.
- Hide race-cost consequences.
- Let strength, fasting, or weight goals compete visually with fixed races.
- Make it look like a crypto dashboard had a child with a Garmin settings page.
