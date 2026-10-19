# AERION — The Journey | Section-by-section quality contract

**Prepared by:** AERION Main · 19 October 2026  
**Status:** Creative/UX direction **prepared for owner review**. **No implementation approved; do not commission Codex, Hermes, Work or deployment from this file alone.**  
**Scope:** Public `/` website only. Private Personal Beta `/app` architecture, functionality, theme and actual state must not be altered.

## 0. Verified baselines (version confusion ends here)

- **Actual final owner-approved Design source (immutable source of visual identity):** `public-site/AERION_THE_JOURNEY_APPROVED.html` (source commit `281aae88297d2c53893430f6bdc5e42282f056cc`; approved pack `AERION_FINAL_APPROVED_HANDOFF_2026-10-19.zip`). Preserve AE Candidate B gradient/logo, **reference-C wordmark**, dark athletic identity, approved six-stage journey, four sports/goal modes and the signature interactive detour.
- **Current owner review to improve:** `public-site/AERION_JOURNEY_PERSUASION_REVIEW_V4.html` at commit `c476693b7ed273e81da7263973bc364f12924c30`. V4 is **not owner-approved final** and has not passed independent browser QA.
- **Actual hosted Personal Beta app:** PR [#19](https://github.com/dennisariens/endurance-engine/pull/19), head `2ac9a8c413ca3f592ee443c924e74d399f7ab8f2`. Screenshot of real app *with synthetic state only*: `docs/personal-beta/integration/desktop.png` on that commit. Actual UI includes Home, Training, Performance, Coach, Goals, Races, Recovery, History, Settings & data; Home is evidence-led with “What do I do today?”, a recommendation, “Why this recommendation?”, next 72h, goal direction and evidence behind today. The current public-site tablet is NOT a faithful rendering of that actual shell.
- **Wrong-source warning:** current PR [#21](https://github.com/dennisariens/endurance-engine/pull/21) depicts the prior `REFINED` page and is visually invalid for this design. Never accept its old screenshots as final evidence.
- **Separate issue:** PR #19 Personal Beta and Intervals provider #18 are P0, public website is P1. No source edits, build commission or merge here without owner approval.

## 1. North star: one outcome per section

Design every chapter around **one visitor question + one visual demonstration + one clear action**. If any graphic cannot answer a question, remove it or make it purposeful.

The homepage must pass a *three-second test*: “This is an intelligent endurance coaching product for running, cycling and triathlon, which accounts for goals, recovery and real life.” Within *fifteen seconds*, the visitor can open a convincing adaptation demo. This is a qualitative design acceptance exercise, not a claim of measured conversion.

### Creative hierarchy
1. Brand authority: exact approved AE + reference-C wordmark; strong typography, deep navy, disciplined whitespace.
2. Real product: authentic PR #19 Home/Coach/Goals architecture under fictional state — not an invented generic fitness dashboard.
3. Evidence-led story: goal → observed constraint → coached choice → impact on next days → long-view progress.
4. Section-specific colour: gradients as *relationships*, not a repeated rainbow.
5. Motion: creates focus, context and progression; never noise, strobe or scroll-jank.

### Palette
- Deep ink `#07111E` and richer navy layers for most backgrounds.
- Off-white `#F5F7FB` for large headings and all body content.
- Electric blue `#58C6FF` for precise product/data/navigation.
- Pink `#FF5FB8` for a contextual human/adjustment signal; softer `#FF9DCB` for large visual regions.
- Lime `#F0FF6B` for one primary action or milestone at a time, **not** every heading and button.
- Reserved signature AE logo gradient: lime → pink → blue (do not edit the approved logo).
- *Derived editorial treatments* (not palette replacement): **Goals** lime→warm coral→pink, **Recovery** soft pink→periwinkle→blue, **Performance** blue→icy cyan→mint, **Long view** off-white→pale blue with small lime marker.
- Never use bright saturated gradient slabs behind paragraphs. Critical text is solid with sufficient contrast. Prior owner screenshots show webkit transparent gradient-text rendering as blank rectangles; use gradient headlines ONLY if Chrome + Safari have been visually verified, with working solid fallback. Prefer reliable solid headline / gradient rule or chart accent.

## 2. Header — premium gateway

**Visitor question:** “Where do I explore, and how do I access my own AERION?”

**Keep:** approved AE+C lockup, four intuitive section anchors, compact beta label, sticky calm glass/navy header.  
**Improve:** 
- **Athlete Login** is visually unmistakable yet refined: off-white inner fill or dark fill with a thin AE-gradient border, lime arrow, strong focus ring; no perpetually moving glow.
- Sticky header becomes slightly more solid after scroll; matching active section gets one thin blue or chapter-colour underline. 
- Distinct primary public action “Explore the coaching demo” in hero; login is for already-authorized athlete only.
- Mobile: actual accessible open/close nav, sufficiently large touch surfaces, no horizontal overflow, no dead CTA.

**Reject:** pretend sign-up, fake “Join beta” flow, inaccessible text-only navigation, oversized saturated navigation strip.

## 3. Hero — flagship, credible product presentation

**Visitor question:** “What is this and why would I care?”

**Keep:** `TRAIN FOR / THE LIFE / YOU LIVE.`, wordmark, atmospheric navy, approved AE brand, multisport positioning.  
**Make unmistakable:**
- One **dominant, legible** framed product view using the **real PR #19 Home composition**, rendered only with a separate synthetic fixture. Its distinctive labels/structure matter: Today; the recommendation; reason/evidence; next 72 hours; your direction. Do NOT pull screenshots from private owner accounts or construct arbitrary “Good to train 82%” when no source supports a score. If synthetic recovery is missing, an honest unavailable state can be a more credible product demo than a made-up ring.
- Supporting phone demonstrates **the same recommendation and same sample athlete** with simplified mobile layout, so tablet + phone communicate ONE storyline. The watch should be removed unless it independently proves integration; currently it competes visually and creates false product fidelity.
- Improve composition: dashboard anchored in clear spatial plane; secondary phone approximately one-third the tablet's apparent width, natural foreground occlusion/shadow, aligned vanishing geometry, no overlay of essential text. Subtle cool product lighting, no gratuitous ornamental chart or terrain line beneath hero.
- One concise explanation: “Goals, recovery and your real life change what makes sense today.” Short subtext; one **Explore coaching adaptation** anchor to the actual interactive demo and clearly secondary **Athlete login**.
- Explicit `Illustrative product view · fictional athlete data` small but legible.

**Proposed screen story (all illustrative, based on real UI architecture):** sample athlete aims at a running goal; today AERION advises an easy run or recovery according to the chosen scenario; a visible “Why this recommendation?” affordance demonstrates evidence and uncertainty; next 72 hours reflect the scenario. Never pretend that this exact fixture or coaching suggestion was produced by the live owner's engine.

**Acceptance:** A new visitor can identify the product from hero alone; app architecture faithful; top action finds demo; hero at 390px retains one legible product story rather than miniaturizing a desktop screenshot to unreadability.

## 4. Editorial bridge — the start of the route

**Visitor question:** “How will this journey work?”
- One title: `ONE ATHLETE. / A ROUTE THAT ADAPTS.`. Do not restore a second redundant manifesto/interlude.
- White first line, second line a reliable icy-blue/soft-violet **or** a two-colour typographic treatment validated in Safari; build contrast from supporting topographic scenery and tiny warm tick, not giant rainbow-filled lettering.
- Begin road corridor visibly AFTER the introduction, with one clear route head; avoid text collisions. The line should sit in intentional margins/gutters and lead the eye to Stage 01.
- Short instruction: scroll follows one route; each stage brings the next coaching decision into focus.
- Acceptance: nothing crosses the heading or body at 1440, 768, 390, 375, or 200% zoom.

## 5. Stage 01 — THE WHOLE ATHLETE

**Visitor question:** “Will AERION understand my whole situation rather than my training totals?”

**Keep:** whole-athlete editorial headline and human context.  
**Recompose right-hand UI as “The evidence behind today,” faithful to the actual Personal Beta:**
- Three clearly sourced fictional indicators: sleep, resting HR/HRV, recent training/constraints; each labelled with unit, look-back period, provenance and freshness. If evidence is missing, label **Unavailable**, never invent a score or hide missing evidence.
- One standout *human context* insight: “Heavy legs after travel” / “Limited time” as user-reported sample context, not sensor-derived certainty.
- Showcase the relationship between physiology and life with soft **pink → blue** detailing confined to thin panel rules and charts; all body content remains legible neutral.
- Remove competing equal-weight metric boxes if their exact values do not inform the upcoming coaching decision.
- Action within demonstration: a small link “How this affects today's plan” leading to adaptation.
- Motion: upon route arrival, card lifts and breathes into focus; route avoids headline completely.
- Acceptance: explain, not merely display, at least one specific coaching-relevant signal.

## 6. Stage 02 — A GOAL. OR JUST GROWTH.

**Visitor question:** “Can this coach adapt to MY kind of goal?”

**Keep:** original approved, visually rich **four selectors**:
1. Berlin Sub-3 (running; dated illustrative goal)
2. Kona/triathlon qualification **aspiration only** (never imply qualification guaranteed)
3. Cycling FTP development
4. Train for Life (no race date/no finish-line countdown)

- Goal selector uses warm lime→pink as a **single meaningful** highlighted perimeter/aspiration mark. Resting interface remains deep navy.
- Within the same viewport, selected goal dynamically updates: milestone, chosen goal focus, sensible units, illustrative goal chart, plan preview, progress tab and Stage 06 story.
- Train for Life switches to consistency/wellbeing and a continuous journey, **never** race-completion language or a false infinite countdown that implies race achievement.
- Add a short realistic premise: “Choose a goal to see the coaching example change.” No fake personalization claims or personal-data writes.
- Acceptance: switching four modes updates all downstream connected demo labels/state coherently, keyboard/touch accessible.

## 7. Stage 03 — A PLAN THAT FITS.

**Visitor question:** “What do I actually receive each week?”

**Visual:** calm, solid navy/steel chapter to give visual breathing space between expressive goal and adaptation modules.
- A concise, **usable** 7-day timeline with today prominent; support recovery and rest alongside quality sessions.
- Show the relation `This goal + evidence + availability → this week's structure`, without fabricating precise training load or generated forecasts.
- On click, day's detail explains what, duration/intensity and why; unresolved evidence produces an honest uncertainty state.
- Borrow hierarchy from the actual AERION `Today` + `next 72 hours` + training plan screens; don't depict entirely different planning controls.
- Acceptance: at 390px individual days are usable; plan day switches are synchronized with selected goal and scenario; no horizontal scrolling.

## 8. Stage 04 — THE PLAN MOVES. (The flagship interaction)

**Visitor question:** “Can I SEE why an AI coach changes a plan?”

Give this chapter the **strongest interaction** on the entire page; avoid competing visual theatrics elsewhere.

Design a three-part before/why/after story:
1. **Before:** planned session and context in one compact, credible card.
2. **New evidence / constraint:** the selected scenario (ready; poor sleep; limited time; travel; injury).
3. **Recommendation:** adjusted training and next 72h consequence, with explicit reason and uncertainty; preserve athlete choice.

- Existing five scenarios stay. Any injury illustration must avoid treatment/diagnosis claims.
- Show an animated route detour ONLY when the scenario changes; one transient alternative path, no infinite pulses. On reset/ready, route returns without jitter.
- Soft pink→blue transition can signal change, while amber/lime reserved for actual attention or positive milestone. Red/green health statuses must retain meaning.
- The change must be visible **in the planned workout and explanation**, not just a coloured route.
- Acceptance: 5 scenarios differ appropriately, every selectable button exposes an observable before/after and reason; selected goal/plan/progress remain coherent. Same sample person across hero and this demonstration.

## 9. Stage 05 — PROGRESS IN CONTEXT.

**Visitor question:** “How will I know whether training is working?”

**Recommended editorial title:** `PROGRESS / IN CONTEXT.` rather than `PROOF, NOT PROMISES`, because the current charts show **fictional sample data**, not verified outcomes. If owner prefers existing headline, add an unmissable `Illustrative history—not proof of efficacy` qualifier.

- One substantial interactive chart, not multiple mini charts. Four tabs (volume, speed/pace, power, recovery) remain, using sport-appropriate metrics and units.
- Always label **time window** (e.g. illustrative eight weeks), change from start to latest, what improved/what did not, and source/sample status. Never describe a fall in pace seconds as “slower” when it means faster, or imply all variables have a universally positive upward direction.
- Two supporting observations, not invented “confidence” or fake percentages; missing/recent data represented honestly.
- Use blue→cyan→mint for precise evidence visual language, and one accent colour per distinct series/meaning. Not a wall of saturated gradients.
- Action “What does this mean for my goal?” links to relevant goal context or a short tooltip.
- Acceptance: chart responds to each of four metrics and four goal modes with correct labels/time/units, no arbitrary growth claims.

## 10. Stage 06 — BEYOND THE GOAL.

**Visitor question:** “What happens after a race, a setback or a changing goal?”

- Preserve **ONE**, and only one, original AERION topographic ascent with a clear milestone and path continuing beyond it; label the milestone as sample/illustrative. It is the emotional culmination of the journey, not another performance chart.
- Keep the chapter meaning personal development: staying healthy, a stronger season, new goals or simply sustained enjoyment. Avoid “THE JOURNEY CONTINUES” immediately followed by “YOUR PATH CONTINUES.”
- Use mostly off-white / pale-blue editorial heading, a lime milestone pin, and restrained terrain lines behind the composition. Separate the big event art and the supporting explanatory card so neither looks squeezed.
- When the goal is Train for Life, swap milestone label to `a habit maintained` / `the next season` rather than `race reached`.
- Acceptance: clear emotional payoff, one distinct hero-elevation graphic, no repetitive finish visuals.

## 11. Finale — KEEP BECOMING.

**Visitor question:** “What can I do next?”

- A **different visual grammar** from Stage 06: a small signature beacon/orb and well-staged negative space, not another ascent graph. Section should feel intentionally resolved, not empty.
- Keep `KEEP BECOMING.` as flagship closing statement; don't redundantly say `CONTINUES` again.
- Public action: return to `Explore the coaching demo` (or choose another goal). Private action: `Athlete Login` into real hosted `/app` on integration (standalone preview may still explicitly show a demo-only modal).
- `Private Beta` status and illustrative data disclosure remain visible. No fake waitlist, no fabricated public onboarding, no invented customer quote.
- A separate, understated footer has actual supported trust claims (private owner login, sample-only public preview). Do not advertise real connected Garmin/Intervals data unless verified by deployed backend.
- Acceptance: clear final emotional beat plus actionable next step on mobile and desktop.

## 12. One coherent animation language

Current website has scroll-linked scripting but has **not passed owner-perceived motion QA**. Source presence != visible behavior.

- Geometry: one controller derives SVG route head, six arrival arcs, active chapter and product focus from the same scroll fraction. Recompute after viewport/font/layout changes; avoid route crossing copy/card areas.
- Arrival: finite pair of rings at waypoint crossing, `~0.75–1.1s`, forward/backward re-arm; never endless `routePing`. No pulse while stationary.
- Active scene: perceptible but controlled: `scale(.96 → 1.025)` approximately, `12–28px` lift, contrast/border and text focus; previous scene settles. No scroll-jacking or repeated re-layout; if the user can't see the focus change, adjust choreography rather than increasing glow intensity.
- Route presentation: one moving beacon, quieter road and no headline collisions; optional subtle camera/terrain parallax only if it improves wayfinding, not obligatory.
- Reduce motion: accessible static chronology with no zoom, pulse, looping animation; focus still visible through colour/border and `aria-current`.
- Performance: at most one rAF per scroll update, avoid layout reads/forced reflow at each waypoint; tests at 1440/1280/768/390/375, 200% zoom; verify physical Safari/iPhone before production.
- Scroll forward AND reverse across all 6 waypoints; keyboard/anchor navigation reaches stage headings with sticky-header offsets; moving animations never conceal usable links/buttons.

## 13. Product and ethical truth contract

- Public demonstration remains isolated from `/api`, athlete state, credentials and real workout records. No private data in HTML screenshots, repo, GitHub issue comments or recordings.
- Do not treat simulated examples as measured data. Dates, units, changes, model recommendations and source freshness must be marked illustrative.
- The genuine secure app login lives in `/app` and requires the existing server-authorized session; never recreate login in the public demo or weaken origin/CSRF.
- Honest recovery when evidence is missing matters more than a high score graphic.
- No public sign-up or beta queue unless an actual approved workflow and privacy policy exist.
- For product visuals, **derive IA and screen hierarchy from PR #19** with a clean synthetic fixture. The website is not authorized to silently redesign the authenticated application.

## 14. Competitive yardsticks (principles, not copying)

- **REN:** confidence and editorial colour, but avoid looking like their gradient or photography.
- **Runna:** immediate proposition, real app screens, low-friction first action.
- **JOIN / TrainerRoad:** clarity of next workout and credible visualization of plan adaptation.
- **Athletica:** shows why multisport/adaptive AI is a competitive baseline, not a unique selling point.
- **TrainingPeaks:** meaningful historical evidence without reproducing high-density analytics.
- **WHOOP:** easy-to-read recovery hierarchy without overclaiming physiological certainty.

AERION differentiates by making **evidence, uncertainty, recommended action and athlete control** a single coherent experience. Validate this by the real demo; do not assert superiority as a measured fact.

## 15. Finish gates / stop the iteration cycle

### Gate 1 — single owner design checkpoint (NO CODEX YET)
Main/Design produce **one** visual storyboard of **all sections** (hero, bridge, 6 stages, finale, header) tied to this contract and the final approved source, not another 12 concept alternatives. Hero captures must visibly match actual PR #19 screen architecture. Show distinct colour roles, one elevation graph, one beacon, active vs inactive panels and a before/after adaptation state. Owner either approves or returns **one consolidated list**. No creative ambiguity passed to Codex.

### Gate 2 — one engineering pass AFTER owner approval
Codex updates the existing **wrong-source PR #21** using the approved storyboard/source, retaining only the working Express / public-private separation. Release SHA + real desktop/mobile screenshots + scroll recording + browser tests from current SHA; mark old screenshots obsolete. Do NOT change PR #19 private coaching/UI or request Work credits.

### Gate 3 — independent confirmation
Hermes one read-only release-blocker review after Codex reports exact SHA, only once P0 provider issue #18 allows. Focus on animation forward/reverse, four goals × five scenarios, every day/chart mode, accessibility, real iPhone Safari, no public/private crossing, images/wordmark and accurate synthetic labels. No redesign loop.

### Gate 4 — release
Owner/Main final acceptance, private hosting TLS/security/off-host backups and correct `/app` routing. No deployment or merge without approval.

### Definition of done (visually testable, not subjective-only)
- Hero tells what/why/for whom in 3s and lets user open adaptation in 15s.
- Tablet is faithful to actual Personal Beta Home IA (fictitious sample state); phone tells the same story.
- No untested gradient-text rectangle, clipped/overlapping texts, overflow, unreadable mini phone UI or arbitrary terrain line.
- Six clear chapters with distinct visual identities; one meaningful coaching demo and truthful goal-aware analytics.
- Exactly **one** journey elevation graphic plus a distinct small finale beacon.
- All six waypoint arrivals noticeably synchronized with chapter lift/focus on forward and reverse scrolling; reduced motion dignified and usable.
- Real login link to `/app` only when integrated; sample public demo stays entirely separate from authenticated API.
- All committed QA artefacts come from the exact reviewed SHA. **Evidence missing = NOT VERIFIED**, not “pass.”

---

**Current status:** This file documents the single next design direction. It is **not** an authorization to modify the site, run Codex, restart Design iterations, merge, publish or operate the owner's actual AERION data.
