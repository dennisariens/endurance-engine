# AERION V3 — Runtime audit addendum

Date: 2026-10-16. Applies to Work #5 / PR #8, Hermes #4 and implementation #6.

## Evidence attribution

Runtime findings below are supplied by the owner from the parallel auditor. Work has not independently rerun that Mac browser session. The audited checkout HEAD, source-only status/delta and preservation plan are not included in this addendum; P0 source reconciliation remains open.

## Reported runtime evidence

- Port 5174 was initially down. Auditor started Vite and left it running. App and /api/briefing returned HTTP 200; briefing reported ok:true. This proves availability, not live Intervals provenance.
- Port 9119 was untouched and not listening.
- All nine navigation screens opened without uncaught browser exceptions. Theme switching changed computed background; full light-theme accessibility is not established.
- Backup export generated a JSON download link under interception. No private backup was saved/inspected. Completed download, import and restore remain untested.
- Desktop Home hero had overlapping oversized text. At 390 px, navigation/status pushed Home below the fold despite no document-wide horizontal overflow. /favicon.ico was missing.
- No application source was changed by the auditor. Starting Vite was a runtime state change.

## Source findings independently corroborated by Work

Inspected remote product source at 56ddc1d107b40f2bd880decae3a6264bbcd00717:

1. server/aerionApi.ts buildBriefingPayload fetches server context, chooses fetched activities or bundled fixtures, uses default goals, and can substitute default races even when a successful fetch has no races. It does not ingest browser-local edits, imported backups, selected goal or decision history. Its state also merges defaults with fetched state. Therefore a live-labelled payload can still contain default fields; ok:true is not a data-quality guarantee.
2. chartData.ts builds load, drift/durability, readiness trajectory, recovery lag and health history through fixed formulas/defaults. These are not measured historical series. Some outputs are arbitrary illustrative proxies, not validated estimates. A label alone must not lend them scientific validity.

## Updated implementation acceptance

- Home and in-app coaching must consume the existing browser-derived evidence/state consistently. Do not replace them with /api/briefing as if the endpoint were equivalent.
- Until the server/browser boundary is reconciled with tests, explicitly identify endpoint context as independently fetched/fixture-derived and potentially different from local state. Do not claim canonical parity or live completeness.
- Keep decorative proxy series out of Home evidence. For secondary screens, hide unsupported illustrative series from normal analytics or replace them with empty states; show estimates only when a defined model and provenance justify that description. Do not replace unknown metrics with constants, zero or unrelated scores.
- Queue canonical snapshot/provenance reconciliation as bounded follow-on engineering; no backend rewrite is authorized merely by this audit.
- Require regression coverage for missing evidence, fresh-sync/stale-observation separation, selected goal/local edits versus server context, and no synthesized historical measurement claims. Boundary parity must be tested before claiming it works.
- Desktop: no overlapping hero text at target viewports and text zoom. Mobile: compact navigation/status lets Today appear in the initial viewport; no horizontal overflow alone is insufficient.
- Fix the missing favicon using the approved asset as part of the reviewed web implementation. This does not authorize native app icon installation.
- Test backup download/restore only with synthetic data in isolated storage. Do not test restoration against the user's live profile. Native Electron packaging and full responsive/accessibility QA remain pending.

## Gate status

Runtime availability/navigation/basic-theme evidence: received from auditor via owner. Source provenance defects: corroborated on pinned remote source. Mac source reconciliation: still pending exact HEAD/branch, sanitized status and local-vs-remote source delta/preservation plan. Codex P2 remains uncommissioned under the explicit P0 gate. No merge, installation or deployment.
