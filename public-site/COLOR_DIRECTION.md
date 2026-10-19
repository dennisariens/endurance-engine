# AERION — The Journey: creative direction locked

**Status:** Design implementation directive, 19 Oct 2026. This is NOT a tested website release.

**Creative owner:** AERION Main. Keep approved Candidate B AE geometry and master gradient unchanged. Use the refined Design branch source, not the old holding V2.1. Website scope only: DO NOT alter the authenticated Personal Beta's colours/coaching state.

## Benchmark: Run with REN
REN's hero/product imagery uses confident large-area saturated gradients and immediately exposes its product. Our aim is not to reproduce those colours, shapes, or layouts. AERION must outperform on **our own qualitative acceptance criteria**: expressive yet calm colour rhythm, credible interactive coaching logic, immediately visible product UI, actual private login routing, accessibility and mobile scroll performance. This is a target, not a claim of objective superiority.

## Finished section treatment
| Section | Dominant treatment | Accent |
| --- | --- | --- |
| Hero | Navy → atmospheric electric blue, restrained pink halo | Cool blue-to-pink type treatment + authentic full AE logo |
| Understand / recovery | Solid ink/steel-blue metrics | Pink → violet → blue discrete metric upper strokes |
| Direction / goals | Deep-navy goal card | Thin lime→warm yellow→pink perimeter; off-white target |
| Build plan | Almost monochrome steel/navy | Clean silver/blue; negative space |
| Life happens / adaptation | Deep blue with a warm tone on the coaching detour | Selective pink and clear blue active chip |
| Proof of progress | Solid deep blue | Data cyan, mint secondary (do not recolour semantic data series) |
| Next chapter | Darkest navy; open-ended route | Single AE signature at beacon / route |
| Login | **Off-white**, high-contrast, visibly clickable | Blue detail, direct route to secure `/app` |

## Non-negotiable quality rules
- Avoid a colour on every heading, multiple huge yellow/pink fields or a rainbow on every card. A few dramatic moments are more valuable than constant accents.
- Solid colours should dominate. Keep all body copy in readable off-white/mist; never overlay small typography on bright gradients.
- Coloured chart lines must mean actual series, not just decoration. Sample data prominently labeled; none of the public demo may access / mutate owner state.
- Active, focus-visible and reduced motion behaviour must be preserved. Emphasis via small colour + motion, no attention-grabbing continuous loops.
- Athlete Login is a real path to the existing `/app` secure login, NEVER an imitation authentication widget.
- Brand tokens refer only to approved AE palette; preserve original RGB SVG; no REN colours, logo or compositions copied.

## Integration
`public-site/color-story.css` is an **optional additive, reversible layer** for the refined standalone `AERION_THE_JOURNEY_REFINED.html`. Include after extracted `site.css`, not before, or integrate selectors into the final public-site bundle. Do NOT apply to the private React app CSS.

**Historical source status (superseded by Main’s final Issue #20 comment and committed source):** The full refined source bundle has not yet been transferred into the implementation checkout. The existing `public-site/site.css` is a partial approved asset, not a finished route; do not publish/deploy until original HTML/JS, strict CSP-compatible external assets and `/` → `/app` separation are verified.

**Required final QA:** screenshots at 1440, 768, 390, 375; working demo controls; contrast/focus, VoiceOver/keyboard, real iPhone Safari reduced motion/performance, responsive route alignment, authenticated login with no private-data leakage. Physical Safari may remain an explicit release gate. No production release/merge without owner approval.

**Priority:** Personal Beta PR #19 release/security + Hermes Intervals ingestion #18 come first. Do not consume Work credits for aesthetics.
