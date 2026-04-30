# Dashboard Spec

## Layout

### Top bar

- Product name / codename
- Last sync time
- Data source status
- Settings button

### Primary cards

1. Today
   - Status color
   - Mode
   - Recommended action
   - HR/power cap

2. Next Race
   - Date
   - Name
   - Class/priority
   - Days remaining
   - Fuel/recovery warning

3. Race Cost
   - Latest race cost score
   - Band: Low/Medium/High/Extreme
   - Required recovery window

4. Recovery
   - Resting HR vs baseline
   - HRV vs baseline
   - Sleep
   - Fatigue status

5. Aerobic Engine
   - Z2 volume this week
   - Pace/power at HR trend
   - HR drift flags

### Calendar view

Monthly/weekly calendar with event types:
- Fixed race
- Optional activity
- Blocked date
- Recovery day
- Z2 day
- Strength/core

Required actions:
- Add race
- Add activity
- Add blocked date
- Toggle mandatory/fixed
- Mark illness/injury
- View race block warnings

### Detail drawer

Click event opens:
- event metadata
- race cost if completed
- recommendation impact
- edit/delete buttons

## Visual language

- Dark UI
- Flat bright status colors
- Minimal charts
- No muddy gradients
- No gamified circus confetti. We are adults, allegedly.

## Status colors

- Green: #22c55e
- Yellow: #facc15
- Red: #ef4444
- Injury/Illness: #a855f7
- Fixed race: #38bdf8
- Recovery: #94a3b8
