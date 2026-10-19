# AERION Journey — Issue #20

Bounded implementation of Main's final 19 October instruction. Source:
`aerion/approved-journey-public-preview` at
`254cfcc26112471383ca0d8477712c1fcd4b77f9`, based on Personal Beta PR #19
`2ac9a8c413ca3f592ee443c924e74d399f7ab8f2`. No design reconstruction.

## Public/private seam

- `/`: approved Journey markup with local audit repairs. No API calls, owner
  state, credentials or persistent demo storage. `connect-src 'none'`, no inline
  scripts/styles, no eval, no forms or framing. Athlete Login is an ordinary `/app`
  anchor and works without JavaScript.
- `/journey-assets/`: finite allowlist of three CSS files, Journey JS and the
  derived contour PNG. Source reports, arbitrary files and traversal are denied.
- `/app`, `/app/`, `/app/*`: existing compiled hosted Personal Beta. Its shell
  references absolute `/assets` URLs so refresh/deep links work. Local Electron
  `dist/index.html` is retained; private React JS/CSS assets are byte-identical
  to PR #19 (see `qa/app-assets.json`).
- `/api/*`: existing owner/session/CSRF/revision/database boundary. No API,
  schema, migration, coaching-engine or athlete data changes. Exact host, HTTPS
  and proxy checks remain. Only public GET/HEAD navigation can arrive from an
  external link; cross-origin API and private-app requests remain denied.
- Build files fail closed: missing public bundle does not serve the private app;
  missing hosted shell does not substitute the Journey or local-mode shell.

Run `npm run build` followed by `npm run build:server`. The latter copies only
allowlisted public files into `dist/journey` and writes the hosted `dist/app.html`.
Use the existing absolute `AERION_STATIC_DIR=.../dist`. This is build guidance,
not a deployment. Existing server configuration remains mandatory.

## Audit repairs

A01/A08: one compact editorial bridge; outer route corridors; transitions between
chapters stay above copy and controls. A02/A03/A04/B04: one scheduled animation
frame owns head/focus/arrival. Layout caches 1,025 route samples plus exact
waypoints and their true arc lengths. Scroll frames use a bounded table lookup
and cached layout; no synchronous path probing or section layout reads.

Arrival fires on each forward/reverse arc crossing. A stop re-arms only after
leaving a 48px arc band; 16px selection hysteresis prevents focus chatter. Two
rings run for 0.85s with the second delayed 0.15s, and the class clears by 1.05s.
No infinite checkpoint or detour animation; reduced motion shows static readable
content without rings or a moving beacon. Keyboard waypoints use the same focal
position as scrolling.

A05/A09: larger illustrative proof panel, before/after values, units, comparison
windows and three goal-specific supporting observations. Four goal modes also
update plan previews, scenarios and long-view language. Targets are not forecasts;
no-race mode presents continuity rather than a race achievement.

A06/A07: stage 06 is a three-part long-view narrative. The closing section is a
separate account invitation with a single beacon, not another elevation graph.
CONTINUES has one blue accent. Candidate B artwork, reference-C wordmark styling,
chapter colours, six stages, topographic geometry and alternating route remain.

## Painting repair and reproducibility

The approved contour SVG has SHA-256
`d65dc8d13e9e9757807fd38a5b1e778b61ca9fa1a0a1adbddee0321a2918fff3`.
`node scripts/rasterize-journey-topography.mjs` renders that existing SVG once to a
lossless 1440×4600 PNG. It creates no new artwork. The original source SVG remains
in the approved CSS; the repair layer selects its raster equivalent at the same
size and opacity; its existing 0/9/91/100% fade is baked into the PNG. This trades an approximately 1.7 MB asset for avoiding repeated
painting of dense vector contours. The route glow filters were removed, preserving
the route colour and geometry. No redesign or new imagery.

See `VERIFICATION.md` for actual checks, performance, artifacts and unverified gates.
