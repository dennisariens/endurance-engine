# AERION — The Journey | FROZEN WEBSITE CHECKPOINT

**Frozen on:** 19 October 2026  
**Reason:** Owner decision: **finish the actual AERION Personal Beta product first**. Keep the complete public-site build and accumulated creative/competitive audit safely available in GitHub. **Do not continue website cosmetics or issue Codex/Hermes public-site tasks** until AERION Main and owner deliberately unfreeze this work.

**Repository:** `dennisariens/endurance-engine`  
**Checkpoint branch:** `aerion/journey-frozen-2026-10-19`  
**Frozen from implementation/design working branch at source commit:** `2d1b6923c95703c65a158cf87c9bfdf52b5d021c`  
**Website state:** owner-review standalone V4, **not owner-approved final, not integrated with hosted application, not deployed.** The standalone login opens an informative preview modal; real auth belongs to secure `/app` on future integration.

## 1. Complete source inventory and exact review checkpoint

All links on this page refer to **this frozen branch**, not moving working branches.

| Item | Frozen path | Source/blob fingerprint | Purpose |
|---|---|---|---|
| **Current interactive review — V4** | [`AERION_JOURNEY_PERSUASION_REVIEW_V4.html`](AERION_JOURNEY_PERSUASION_REVIEW_V4.html) | Git blob `2294407b108b22c724274a91c4c448a9e940746c`; authored commit `c476693b7ed273e81da7263973bc364f12924c30` | **Start here.** Entire 701,929-character standalone HTML/CSS/JS with six-stage journey, four goals, five coaching scenarios, interactive progress data and visible route/panel controller. No external private APIs. |
| **True final Design-approved source** | [`AERION_THE_JOURNEY_APPROVED.html`](AERION_THE_JOURNEY_APPROVED.html) | Git blob `e552e71ccf9e7b90bd8087ef3773691d3435a3b8`; source commit `281aae88297d2c53893430f6bdc5e42282f056cc` | Immutable **brand/layout authority** from Design's `AERION_FINAL_APPROVED_HANDOFF_2026-10-19.zip`. Do not revert to obsolete `REFINED` artwork. |
| V3 owner-review source | [`OWNER_REVIEW_FINAL_V3.html`](OWNER_REVIEW_FINAL_V3.html) | Git blob `658d22900dc9366e54021c2b37e626f05f83e910` | Pre-V4 state and fallback for diff. |
| **Full latest creative/competitive recommendations** | [`JOURNEY_SECTION_QUALITY_CONTRACT.md`](JOURNEY_SECTION_QUALITY_CONTRACT.md) | Git blob `7f6a4b061eac5d6d7d9e0a5b7444d3150ba34922`; authored commit `2d1b6923c95703c65a158cf87c9bfdf52b5d021c` | **Single source of next design decisions.** Header, hero, bridge, stages 1–6, finale, evidence/data truth, accessibility, competitor lessons and all acceptance gates. |
| Post-approval change freeze | [`POST_APPROVAL_CHANGE_FREEZE.md`](POST_APPROVAL_CHANGE_FREEZE.md) | Git blob `f1d69363874bfd4ef2ea41a1351e0c21b74216ee` | Earlier owner screenshots and all post-approval edits A01–A09/B01–B05. |
| Complete double build/design audit | [`DESIGN_DOUBLE_AUDIT.md`](DESIGN_DOUBLE_AUDIT.md) | Git blob `c793454904ac6cd5b90fcd69b0294277f6c5deaa` | Root-cause audit of animation, ending repetition, browser integration, quality gates. |
| Colour system | [`COLOR_DIRECTION.md`](COLOR_DIRECTION.md), [`color-story.css`](color-story.css) | Working design references, **some older selectors** | Supplementary brand rationale; **not automatically authoritative over final-approved Design HTML**. |

The frozen branch also preserves the earlier `index.html`, `site.css`, `journey.js`, and related intermediate working files. **These were produced from an older REFINED iteration and are not the latest approved web design. Do not mistake them for current build.**

### Open the frozen V4 for evaluation

[Interactive standalone V4 (frozen GitHub branch)](https://raw.githack.com/dennisariens/endurance-engine/aerion/journey-frozen-2026-10-19/public-site/AERION_JOURNEY_PERSUASION_REVIEW_V4.html)

This links to a third-party static rendering of the archived HTML; actual compatibility/performance was **not** independently verified in Safari or all browsers. A separate self-contained download can be opened locally. The frozen branch source and hashes, not the renderer, are authoritative.

## 2. Competitive design audit — what we learned

- **REN:** Colour confidence, clear emotional impact; our AE identity is already strong. Use differentiated chapter accents (warm goal, pink→blue human/recovery, cyan performance), not copied REN palette/compositions.
- **Runna:** Immediate “what does this app do?” and believable mobile product screens. Our hero must communicate purpose immediately.
- **JOIN / TrainerRoad:** A convincing next workout and **observable** before/why/after adaptation; that should be AERION's most memorable interactive module.
- **Athletica:** Multisport adaptive training alone is not unique; we must earn distinction through evidence, uncertainty, athlete control and quality.
- **TrainingPeaks:** Measured history/units, provenance and meaningful progress rather than attractive random chart history.
- **WHOOP:** Human-readable recovery context without inventing a proprietary readiness score.
- These are **creative benchmarks**, not objective superiority or independently measured conversion results.

## 3. Locked design choices vs remaining work

### Keep — no new conceptual design cycle
- Approved AE Candidate B gradient logo and Reference-C wordmark; navy/off-white foundations; real endurance-athlete sensibility.
- Editorial hero statement `TRAIN FOR / THE LIFE / YOU LIVE.`.
- Six stages: **The Whole Athlete → A Goal or Just Growth → A Plan That Fits → The Plan Moves → Progress in Context → Beyond the Goal**. V4 still renders the Stage 05 heading `PROOF, NOT PROMISES.`; consider changing its heading as the quality contract suggests, because its sample figures do **not** prove results.
- Four goal modes: Berlin Sub-3, triathlon qualification, cycling FTP, Train for Life. Five coaching scenarios: ready, poor sleep, limited time, travel, injury. Demo data must remain fictional, consistent and isolated.
- Exactly **one** expressive original long-view elevation graphic in Stage 06; a **different, restrained final beacon** in `KEEP BECOMING.`. No `continues → continues` repetition.
- Finite waypoint arrivals and visible stage emphasis; reduced-motion equivalent.

### Improve after product foundation is usable — prioritized
1. **Hero fidelity (P1):** Current tablet is a hand-built concept, not a faithful rendering of the real Personal Beta. Recreate from the actual PR #19 `Home` structure and supporting phone using a clearly separate **synthetic fixture**. Show: real nav hierarchy; Today recommendation; `Why this recommendation?`; next 72 hours; goal/direction; evidence behind today. Do not include private athlete data. No gratuitous watch or decorative horizon line.
2. **Persuasion / product demonstration (P1):** First screen should answer what AERION is, who it serves and why it adapts; anchor CTA opens an actual before→why→after coaching example with meaningful consequences. Existing Athlete Login is for real private users only; do not invent a public sign-up/waitlist.
3. **Gradient/type discipline (P1):** V4 repaired two Safari-reported gradient-text blocks by switching to solid blue. Next colour direction is **section-specific**: goals lime→pink, recovery pink→blue, performance blue→mint, alongside plenty of navy/off-white. Verify real Safari before allowing gradient-filled large type. The site's accumulated stylesheet has many gradient and `!important` overrides, so consolidate when safely integrating; don't redesign the private app.
4. **Visible motion (P1):** Route head, waypoint, active panel scale, focus/zoom and prior-panel settling must visibly coincide in real forward/reverse scrolling. Avoid lines cutting through title/text and continual pulses; minimize layout thrashing.
5. **Stage purpose and visuals (P1):** Evidence behind the session (truthful freshness/unavailable); distinct four-goal studio; usable seven-day plan; unmissable adaptation; one large explanatory progress chart with correct time windows/units and fictional labels; meaningful long-view milestone; non-repetitive finale.
6. **Trust / conversion (P2):** Honest integrations and feature status, clear sample labels, no fake statistics/testimonials, prominent secure login boundary and a useful public demo that doesn't require an account.
7. **Release visual QA:** Real responsive review (1440, 1280, 768, 390, 375 and 200% zoom), real iPhone Safari, keyboard/VoiceOver, reduced motion, no overflow, compiled assets and strict CSP, forward/backward six-waypoint screen/video evidence. **No test claims without artifacts.**

## 4. Critical real-product dependency

**Personal Beta integration [PR #19](https://github.com/dennisariens/endurance-engine/pull/19)** is the legitimate app basis; its compiled private desktop screenshot is at `docs/personal-beta/integration/desktop.png` at PR #19 head `2ac9a8c413ca3f592ee443c924e74d399f7ab8f2`. This uses **synthetic state**. Its Home experience is more specific than the existing website tablet:

- Server-confirmed athlete view; Today coaching decision, `Why this recommendation?`, next 72 hours, current goal and evidence behind today.
- PR #19 claimed actual PostgreSQL/desktop/mobile browser integration tests but had **not been deployed** as of freeze; verify current status before release.
- Separate **Intervals.icu server ingestion Issue #18** remains a required real-data provider; older `POST /api/sync` safely responds unavailable until provider code is integrated. Never pretend the website's fictional coach uses actual connected athlete inputs.

**[PR #21](https://github.com/dennisariens/endurance-engine/pull/21) is an incomplete WRONG-DESIGN-SOURCE integration** that started from the older `REFINED` HTML despite its own integration tests. It is **not** the visual version to ship. Leave it paused; when resuming, integrate the true approved baseline + approved post-release changes while retaining only its proven secure `/` → `/app` separation. Old PR screenshots do not count as proof for V4.

## 5. Operating state at freeze

- **AERION website: PAUSED.** Do not commission Codex/Hermes, do not open new website cycles, do not merge #21, deploy static V4 or alter DNS/TLS for public aesthetics.
- **AERION product: ACTIVE P0.** Continue reliable single-athlete Personal Beta; authenticated PostgreSQL state, genuine Intervals.icu ingest without duplicated load, coaching correctness, recovery constraints, actual browser/device security and off-host backup/restore. Use the real app first to inform the website hero.
- No migrations or changes to the owner's current Mac mini data without explicit permission. No provider keys, screenshots of private records or secrets in public GitHub.
- Resource allocation: Main owns prioritization; **Codex** implements isolated, scope-bound app changes; **Hermes** implements provider / independent engineering QA; **Work** only for a unique unavoidable cross-app/browser task. Do not spend Work credits on iterative website colour fixes.

## 6. Exact safe resume procedure (when owner authorizes)

1. Reopen this frozen branch and first read `JOURNEY_SECTION_QUALITY_CONTRACT.md`; inspect **V4** and the **true approved source**, not the old `index.html`.
2. Review the functioning Personal Beta as it exists **at that future date**; create a public synthetic demo of real screen hierarchy and a credible adaptation. Compare visual storyboard across **all** site sections; one consolidated owner approval.
3. Create a **new working branch from this frozen checkpoint**; never modify the archive branch or the original owner Mac's data.
4. Implement the single owner-approved design in public `/` without changing private `/app` coaching screens or protected APIs; avoid blindly cherry-picking the obsolete PR #21 visual bundle.
5. Codex produces one reviewable PR with actual screenshots, scroll recording, reproducible tests and exact SHA. Hermes one independent read-only QA after P0 allows. Final Main + owner approval before merge/deploy.

## 7. Frozen checkpoint intent

**This branch is a retrievable design, audit, and executable HTML review archive, not a production release.** It exists so future conversations can restart precisely where the owner paused—without repeated audits, guessing which “latest” version was meant, or losing post-approval decisions.

**Immediate next task: AERION Personal Beta, not public Journey design.**
