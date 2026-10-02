# Data model contract

## Authority order

1. Actual completed activity.
2. Verified recovery/health evidence with source and timestamp.
3. Fixed calendar events and explicit athlete constraints.
4. Derived coaching state and recommendations.
5. Fixtures/defaults only when clearly labelled and isolated from real state.

## Core records

- Activity: stable source ID, source, type, start time, duration, distance, HR/power evidence and import timestamp.
- Race/event: stable ID, date, discipline, priority/fixed status and source.
- Recovery snapshot: source, captured time, sleep/resting-HR/HRV fields and confidence.
- Decision log: recommendation, athlete action, rationale, expected consequence and timestamp.
- Goal: target/date/priority, readiness evidence, limiter and Path-to-Goal state.
- Athlete state: canonical current snapshot derived from trusted evidence.

## Invariants

- Deduplicate by stable identity before presentation or coaching calculations.
- Never silently replace a real activity with a fixture or manual default.
- Preserve raw source evidence where practical and record normalization provenance.
- MCP/coach briefing context must derive from the same canonical state as the UI.

