# AERION — The Journey | Independent double audit
**Date:** 19 October 2026  
**Audit scope:** approved visual reference + previous Precision Polish standalone, approved/Main-colour standalone preview, and live GitHub branch `aerion/approved-journey-public-preview`.  
**Action:** report only. No commits, deployment, or changes to the coaching app.

## Executive decision
**APPROVED DESIGN LANGUAGE · NOT PRODUCTION-READY IMPLEMENTATION.** The AE identity, C wordmark appearance, refined palette, winding topo route, actual product previews, four sample goals and adaptive roadblock are worth preserving. The faults are local to storytelling rhythm, stage activation, finishing composition and public integration. Do not reopen the visual concept.

### Evidence and confidence
- **Visual:** user-provided desktop screenshots of introductory journey, Proof, stage 06, and closing section, checked against actual standalone HTML structure.
- **Local source:** `AERION_THE_JOURNEY_POLISHED_PREVIEW.html` and `AERION_APPROVED_DELIVERY_2026-10-19/website/AERION_THE_JOURNEY_APPROVED.html`.
- **Repository:** `dennisariens/endurance-engine`, branch `aerion/approved-journey-public-preview`, `public-site/COLOR_DIRECTION.md`, `public-site/site.css`, `public-site/color-story.css`, `src/main.tsx`.
- **Static validation:** inline JavaScript parses (`node --check`); 81 distinct IDs with no duplicates; zero broken `#anchor` hrefs; six `.stage` sections; 28 named controls; nine images have `alt`. No findings here prove Safari compliance or overall accessibility.
- **Partial browser evidence:** Chromium rendered the standalone HTML and the first scroll measurements changed chapter focus (`--chapter-focus`: `0.518` at scrollY 1200 and `0.787` at scrollY 1900 on one desktop run). Automated comprehensive scroll sweeps stalled/time out and are **not** passed. Browser policy blocked loopback-URL testing; fallback `set_content` does render, but the long sweep also stalled. Cause of timeouts cannot be attributed with certainty to the implementation; it is a high-priority investigation, not established proof of a site freeze.
- **Package check:** the existing `handoff/VERIFIED_BROWSER_CHECKS.json` itself says its combined multi-section sweep timed out. It does not certify Safari, full journey playback, or deployed login.

## Audit A — approved visual/design concept versus latest standalone build

### A01 · P1 · Opening story has two introductions
**Observed:** hero → large centered “It starts with understanding you” → large centered “ONE ATHLETE. A ROUTE THAT ADAPTS” → only then the first real product waypoint. Long blank expanses and a line intersecting the second heading reduce impact.  
**Likely cause:** separate `.interlude` and `.journey-head` each carry a major statement; `.interlude` uses 116px top/126px bottom padding and `.journey-head` another large gap. The route begins in the chapter header region.  
**Fix:** choose one editorial bridge. Let the route originate alongside an identifiable athlete/profile beacon rather than travelling through the headline. Shorten dead vertical distance while keeping breathing room.  
**Acceptance:** first purposeful moving waypoint becomes visible after one natural scroll from hero on both desktop and iPhone; route never obstructs the copy; headings do not feel redundant.

### A02 · P1 · Scrolling changes state, but not at the route arrival
**Verified in JS:** `routeLayout()` sets the waypoint near each section's upper edge (`Math.min(120, r.height*.15)` desktop). `updateOnScroll()` chooses a section by its **centre** (section height × `.46`) relative to the viewport focal line. The pulse observer watches changes to the `is-active` class, **not** whether the animated route position reaches the waypoint coordinate. Thus focus and pulse may occur earlier/later than the visible encounter.  
**Fix:** one source of truth: the **distance between the moving route head and waypoint along the SVG route**. When head crosses a waypoint, activate its arrival once; independently derive focus from normalized proximity. An earlier section must gracefully return to its resting transform as the next approaches.  
**Acceptance:** for all six stops, entering the arrival band triggers exactly one visible short pulse, marker/section coincide in viewport, active panel rises and enlarges, previous panel gently recedes. Rewind/revisit must behave consistently by a documented policy.

### A03 · P1 · Conflicting infinite and one-shot pulse animations
**Verified in CSS and JS:** `.route-stop.is-active .route-stop-ring` has the legacy infinite `routePing 2.7s` animation. A later `.route-stop.is-arriving .route-stop-ring` temporarily overrides it with `stopArrival`, after which `is-arriving` is removed on `animationend`. While still `is-active`, the underlying infinite ping applies again.  
**Fix:** remove the `routePing infinite` active-state declarations entirely. Use a non-looping `arrival` class with two finite rings. Maintain a static luminous ring for the selected stop if needed.  
**Acceptance:** no ring animation continues after about 1.1 seconds; no unexpected restart while paused on a stop; no animation under `prefers-reduced-motion`.

### A04 · P1 · Active product panels lack perceptible focus
**Verified in CSS:** desktop scale only interpolates `.925 → 1.0`, opacity `.67 → 1.0`, brightness `.75 → 1.0` with short linear transitions; mobile overrides are even smaller (`.975 → 1.0` in one rule). A responsive chart can remain visually static despite active-state changes.  
**Fix:** stagger *headline → evidence → product panel* on entry; allow a restrained transform/soft elevation, plus a clear destination lock-in state; avoid blurring important data or dramatic jumps. On mobile use a clear fade/reveal and card rise, not tiny imperceptible scale.  
**Acceptance:** observer can identify the current stop with sound off and without watching the marker, while prior text stays readable. 200% zoom, keyboard focus and reduced motion remain usable.

### A05 · P2 · PROOF, NOT PROMISES lacks the product-proof climax
**Observed:** isolated modest line chart, two generic KPIs and a large right-side headline leave unused space; chart lacks a strong context or visually distinct breakthrough.  
**Fix:** make the data panel the section's focal proof: one sport-specific measurable before/after comparison, larger and clearer chart, values with units and time windows, and 2–3 meaningful supporting metrics. For example, Berlin running volume + matched-HR pace trend + longest easy run; Zwift FTP trend + comparable power-duration tests; recovery vs consistent sleep. Avoid unsupported projections and arbitrary percentage improvements. Let chart and relevant values reveal progressively at activation.  
**Acceptance:** one glance answers “what improved, over what period, compared with what evidence?”, for all four demo modes. Data labeled *illustrative*.

### A06 · P1 · Stage 06 and Final CTA repeat the same curve
**Observed:** stage 06 shows an ascending elevation profile with milestone/continuation; the subsequent Next Chapter/Keep Becoming block shows another very similar climbing curve and milestone with nearly identical metaphors.  
**Fix:** stage 06 = **an athlete's long-view story** (race checkpoint / next season / no-race continuity), using a distinctive horizon/timeline or destination-specific narrative, not another generic ascending curve. Final CTA = **an invitation**, centered on real AERION account entry and a single abstract beacon or subtle route continuation, **no second large elevation graph**.  
**Acceptance:** the two adjacent sections are recognizably different in both silhouette and purpose at thumbnail size; no duplicated graph shapes.

### A07 · P2 · “CONTINUES” accent feels pale and inert
**Observed:** oversized light-blue treatment lacks the confidence of other stage highlights.  
**Fix:** keep most headline off-white; use a selective stronger blue→subtle-lime accent or single blue highlight consistent with Main's palette; not a full rainbow gradient. Limit to this heading and its beacon, not additional cards.  
**Acceptance:** readable on dark/navy with adequate contrast; distinct from the pink/goal accents and the final CTA.

### A08 · P2 · Visual noise and route collision
**Observed:** first route passes through/near editorial copy; active position markers can compete with large uppercase text, with waypoint icons, contours and product plates on same visual plane.  
**Fix:** reserve a route corridor in each layout; keep topographic contours low-contrast and mostly behind empty space; avoid overlap with text or chart controls. Route is narrative layer, product is first visual priority.  
**Acceptance:** desktop 1440, 1280, tablet 768, iPhone 390/375 and 200% zoom screenshot comparisons; route does not interfere with headline reading or tappable elements.

### A09 · P2 · Goal-specific product truth still needs QA
**Positive:** distinct Berlin Sub-3, Kona qualification, Zwift FTP, Train for Life data; example date anchored to 2026-10-19; charts/plan change with selected goal; missing goal evidence sometimes shown as unavailable.  
**Risk:** the long-view panel still says “A GOAL REACHED” and “A checkpoint” even when *Train for Life* has no race. Scenario and plan previews may not remain semantically coherent if a goal mode changes while another scenario is selected.  
**Fix:** audit every displayed unit, sentence and goal date across 4 goal modes × scenario modes × session selections, including no-race language. Avoid showing race readiness when not applicable.  
**Acceptance:** source-consistent outputs for all combinations, no fabricated personal achievements or unsupported forecasts.

## Audit B — current public GitHub branch / implementation state

### B01 · P0 RELEASE BLOCKER · public page is NOT integrated
**Source:** GitHub branch `aerion/approved-journey-public-preview` contains `public-site/site.css`, `public-site/color-story.css`, and `public-site/COLOR_DIRECTION.md` but **no added public-site HTML or JS** in the comparison from integrated PR #12. `index.html` still starts the React app, and `src/main.tsx` selects personal app modes rather than rendering the Journey at `/`. The colour directive explicitly admits: “full refined source bundle has not yet been transferred” and “NOT a tested website release.”  
**Fix:** integrate exact approved standalone layout and interactions into dedicated public entry `/`, isolate demo state from athlete state, keep authenticated application on `/app` (or another approved secure route); obey Main routing and hosting decisions.  
**Acceptance:** direct-load `/` renders working Journey; direct-load `/app` presents real authenticated application; routes survive refresh, are separately testable, and cannot read/write one another's state.

### B02 · P0 for public launch · login contract not implemented
**Source:** standalone `[data-login]` buttons open an information `<dialog>`; no actual `/app` link in the standalone. GitHub `COLOR_DIRECTION.md` requires Athlete Login to route to real secure `/app`.  
**Fix:** in integrated site, direct visible login buttons to approved real login when available, else clearly show unavailable Private Beta state. No fake provider login, no credential collection in demo.  
**Acceptance:** login on desktop/mobile reaches real authentication only, refresh and access-denied tested. Public demo is isolated from health/activity data.

### B03 · P1 · Main palette partly lives only in CSS directives
The GitHub branch's colour contract is sound (blue-led hero, blue/pink restrained recovery, lime→pink Goals, neutral Plan, warm-to-blue Adapt, cyan→mint Progress, darkest finale). But this is an **additive CSS file**, not a source-backed integrated component implementation. A source style build is no guarantee of the requested screen-level hierarchy.  
**Fix:** treat documented Main tokens as authority when porting, keep semantic health/risk colours untouched, check actual computed styles on all viewports. Do not randomly distribute gradients.

### B04 · P1 · motion & performance not release verified
Existing standalone includes 680KB+ single-file HTML with multiple inline imagery/style assets, SVG path recalculation, 23-point path-length binary search each scroll frame, CSS filters, active animations and `ResizeObserver`. No reproducible actual-device performance evidence. In this audit the Chromium scrolling sweep did not complete in the constrained environment; attribution to site vs runner remains uncertain.  
**Fix:** profile long-page scroll and frame budgets on normal desktop/iPhone; test disabling path binary search and effects to localize frame stalls; cache route length/layout; avoid forced layout in scroll handler where possible; schedule work only with `requestAnimationFrame`; use transform/opacity for panels.  
**Acceptance:** smooth, visibly coupled route on physical iPhone Safari and desktop browsers, reasonable LCP/CLS and no console errors. Provide recordings and measured performance, not only static screenshots.

### B05 · P1 · Accessibility and mobile gates open
Static checks found named buttons, anchored sections and no duplicate IDs, but physical Safari, keyboard-only focus traversal, dynamic announcement, mobile touch targets, reduced-motion semantics, 200% zoom and VoiceOver are not verified. Fading nonfocused sections could reduce readability.  
**Fix:** maintain semantic content in DOM, focus-visible outlines, keyboard-accessible waypoint links, `aria-current`, meaningful accessible labels, sensible live updates for demo controls, minimum tap size. Reduced motion should disable route/detour/pulse motion *without hiding the journey content*.  
**Acceptance:** documented Safari/VoiceOver/keyboard and reduced-motion QA.

## Decision matrix (no redesign)
| Preserve exactly | Fix in source | Do not do |
|---|---|---|
| Approved AE Candidate B mark/gradient; reference-C wordmark styling | Sync waypoint-triggered pulse and panel focus | New logo styles or typography experiments |
| Premium dark/navy and Main chapter palette | Opening chapter rhythm; route collision | Add more mountains/photography/glows |
| Six journey stages, alternating left/right/center | Distinct proof panel and long-view narrative | Additional goal types or dashboard sections |
| Interactive goal modes and adaptive roadblock | One-shot detour/pulse and stage-dependent animation | Fake forecasts/data or login |
| Private athlete data isolation | Real `/` and `/app` integration + QA | Unapproved merge/deploy or Personal Beta delays |

## Minimal implementation order — for Main to commission
1. **Integration seam / data safety first (B01/B02).** Decide app route; add working site only with correct auth boundary and truthful private-beta behavior. Do not endanger #13/#19.
2. **One coordinated motion fix (A02/A03/A04/B04).** Remove infinite pulse, synchronize to actual route coordinates, make focus perceptible but restrained. Test *all six* forward/back.
3. **Three local visual edits (A01/A05/A06/A07/A08).** Compress duplicate introductions, give Proof a measurable hero panel, replace one repeated final graph with a conversion-focused invitation, strengthen one word accent and clear collisions.
4. **Cross-mode data + mobile acceptance (A09/B05).** Four goals, all scenarios, real iPhone Safari + reduced motion + keyboard/VoiceOver and performance.
5. One reviewable PR with before/after desktop/mobile screenshots and short motion recording, precise tested SHA, pass/fail table. Main/owner approves merge/deploy.

## Final conclusion
**Design concept: APPROVED. Standalone execution: REFINEMENT REQUIRED. GitHub public implementation: INCOMPLETE.**
Do **not** launch current public branch as a finished site. This is a bounded repair of a strong existing product-preview design, not a call to restart design exploration.