# AERION — The Journey | FINAL source + post-approval change freeze

**Date:** 19 October 2026. **Owner instruction:** Incorporate ALL minor updates requested after the approved HTML, not another sequence of rebuilds. This checklist is the single public-site design implementation acceptance contract. Do not affect Personal Beta PR #19 or provider #18.

## Binding visual baseline — VERSION FINGERPRINT

1. **Final approved Design HTML**, not the early refined source: `public-site/AERION_THE_JOURNEY_APPROVED.html` on this branch; source commit `281aae88297d2c53893430f6bdc5e42282f056cc`, Git blob `e552e71ccf9e7b90bd8087ef3773691d3435a3b8`, 684,075 extracted text characters.
2. Approved original delivery named `AERION_FINAL_APPROVED_HANDOFF_2026-10-19.zip`, with `AERION_APPROVED_DELIVERY_2026-10-19/website/AERION_THE_JOURNEY_APPROVED.html`.
3. Later design evidence: `approved-main-colors-desktop-hero.png`, `approved-main-colors-desktop-goals.png` (approved before 20:39 local); owner screenshots `Scherm­afbeelding 2026-10-19 om 20.42.41.png` (double introductory headline / route collisions) and `Scherm­afbeelding 2026-10-19 om 20.43.03.png` (two near-identical route/elevation finale graphics); independent `AERION_THE_JOURNEY_DOUBLE_AUDIT_2026-10-19.md` (published after those screens). Final Main handoff in chat authorizes implementing these edits. The audit is checked into `public-site/DESIGN_DOUBLE_AUDIT.md`; source is later than original REFINED.
4. Final visual **must retain** the custom Reference-C appearance of the AERION wordmark, approved AE Candidate B gradient/SVG, original hero product visuals, richer 4-goal tile selector and sport-specific goal evidence. Do not substitute older `AERION_THE_JOURNEY_REFINED.html`, its text-first selector, its older AERION wordmark or original PR #21 shots.

## All verified post-approval minor updates to implement together

| ID | Exact issue / user-approved change | Final acceptance check |
| --- | --- | --- |
| A01/A08 | Double introduction: hero → separate “It starts with understanding you” and “ONE ATHLETE. A ROUTE THAT ADAPTS.” Long empty gap and tracking path crosses headline. | One concise editorial transition, first real waypoint after a natural scroll, unobstructed heading and controls at desktop and mobile widths |
| A02 | Route head, stop arrival/pulse and panel focus trigger at different coordinates; single controller is required. | On all six stages forward and reverse, waypoint arrival crosses the head **at the same time** as focus/zoom and selection |
| A03 | Legacy `routePing 2.7s … infinite` continues beneath one-time `stopArrival` pulse; this is present in actual final-approved HTML. | Remove infinite stage pulse; exactly two finite subtle arrival rings, end ≤~1.1 seconds, no repeating while paused, none under reduced motion |
| A04 | Inactive/active panel zoom is too subtle; action is not clearly coupled with arrivals, especially mobile. | Focus and evidence visibly lift as a waypoint arrives; preceding stage settles; every resting data value remains readable; no strobe |
| A05 | Proof section is comparatively empty and generic; chart too small. | Measurable, bigger proof panel by goal with specific units, evidence comparison windows, 2–3 supporting observations; explicitly illustrative, no fabricated verified improvements |
| A06 | Stage 06 The Journey Continues and the “Next Chapter” finale repeat a near-identical ascending route/goal curve. | Stage 06 is the long-view athlete story; final section a distinct private beta/login invitation and **single** beacon; no duplicated elevation curve |
| A07 | “CONTINUES” accent too pale. | Confident selective blue or blue→lime accent, high contrast, not broad rainbow background |
| A09 | Cross-goal/scenario language can become inconsistent, especially no-race Train for Life and future date. | Check four goal modes × all recovery/time/travel/injury scenarios × all seven training days × all four performance tabs; no “race completed” for no-race mode, no unsupported forecasting |
| B01/B02 | Public site not integrated; prior standalone login opens info modal. | Public Journey at `/`, real secure private auth at `/app` (normal login link works without JS), protected `/api`, no demo data/API access, secure static CSP and direct refresh |
| B03 | Main section palette only applies in a supplemental layer on the **older** markup. | Apply **final approved source palette as authority**: navy/off-white, lime→pink goals, pink→blue recovery, blue-led analytics, selectively neutral sections. Do not blindly import old `color-story.css` if conflicting |
| B04/B05 | Browser sweeps/real Safari/VoiceOver/performance were not release-verified by Design. | Actual compiled app in browser, all six scroll stops both ways, reduced motion, keyboard/VoiceOver (when accessible), 1440/1280/768/390/375 plus 200% zoom, focus/contrast, short scroll video; real iPhone Safari marked UNVERIFIED unless physically tested |

## One delivery, no more loop

- PR #21 is a successful engineering pass **against the wrong earlier Design source**; its screenshots, despite passing tests, are invalid as final-design evidence.
- Codex should **reconcile exact final approved source** to PR #21, carry forward proven routing/security/motion fixes only where compatible, and implement ALL A/B edits above in **one** corrected pass. Do not reimagine the visual language or make another P1 scope list.
- The new PR must have a side-by-side source-of-truth visual check: final approved hero and goal-picker must be recognizably identical to approved screenshots (apart from explicitly requested minor changes); one screenshot for each major corrected section, including Proof and both closing chapters.
- New exact commit SHA, desktop/mobile 1440/390 captures, **short real scroll recording**, reproducible browser/PG regression logs, output explanation of applied post-approval fixes. Old PR #21 screenshots should be labeled obsolete, not silently reused.
- Then ONE Hermes independent, read-only QA and ONE final AERION Design visual assessment. No redesign, unrelated refactor, repeated speculative audit, merge, deployment or user-data migration; Personal Beta P0 remains ahead.

**Provenance caution:** The above is based on actual later screenshots, the Double Audit and the explicit Main handoff. It does not purport to quote private Design-chat messages not contained in those source artifacts. Any still-later owner-specific adjustments must be added to this checklist *before* the next screenshot/build, not after.
