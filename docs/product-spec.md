# Product Spec — Endurance Engine MVP

## Goal

Build a dashboard and local decision engine that turns race calendar + Intervals.icu data + recovery markers into a daily endurance briefing.

## MVP Scope

### Calendar

- View fixed races
- Add race
- Edit race
- Delete race
- Mark race mandatory/fixed
- Add blocked dates:
  - travel
  - work
  - illness
  - injury
  - unavailable
- Detect race blocks:
  - 2+ races within 72h
  - 3+ races within 7 days

### Metrics

- Current status: Green / Yellow / Red / Injury-Illness
- Next race and days until race
- Race block status
- Recent race costs
- Weekly intensity events
- Weekly Zone 2 volume
- Resting HR baseline
- HRV baseline
- Sleep baseline
- eFTP / FTP
- Running/cycling max HR
- LTHR/AeT placeholders

### Decision Engine

- Fixed races override optimal planning
- Injury/illness blocks racing
- Fatigue triggers damage-control mode
- Race cost determines recovery prescription
- HR zones adapt from LTHR, AeT, HR drift, fatigue
- Strength/core/metabolic switches affect recommendations

### Daily Briefing

Generate daily output:
- Status
- Mode
- Today
- Session guidance
- Add-ons
- Why
- Race calendar impact
- Recovery
- Tomorrow expectation

## Out of Scope for MVP

- Full training plan generator
- Social features
- Payments
- Native mobile app
- Garmin integration
- Automatic ECRO login scraping
- AI chat interface beyond generated briefing

## Success Criteria

- Dennis can open dashboard and see what to do today within 10 seconds.
- Fixed ECRO calendar is visible and editable.
- Recent Intervals activity updates race cost and status.
- Tomorrow race never gets blocked unless injury/illness is true.
- Dashboard makes the tradeoff obvious: race now, pay cost later.
