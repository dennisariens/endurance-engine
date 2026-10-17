# P2.1 — approved V3 visual refinement

Captured from implementation `7e74bec8c351181afeb7229ea8e8bcc6ed6a3f92`
(presentation change `6424bc3`) on macOS with disposable Playwright Chromium,
Vite at `127.0.0.1:5174`, reduced motion and synthetic records only.

Primary action: approved AE pink `#FF5FB8`, dark label `#10151D`, lighter pink
hover `#FF8FBA`, lime pressed `#F0FF6B`. Dark selection uses lime; light selection
uses a darker olive for readable text. Small pink labels use a darkened pink in light mode. Blue marks interactive hover borders and
telemetry. Thin lime → pink → blue navigation/route details reuse the AE master.
Typography, layout, responsive breakpoints, approved logo and coaching logic stay
as supplied by the approved V3 build.

## Screens

Every image is an actual full-page browser screenshot. Fixed mobile navigation
stays at the viewport bottom, so it appears partway through a full-page image.

| Screen | Desktop dark | Desktop light | Mobile dark | Mobile light |
| --- | --- | --- | --- | --- |
| Home | [dark 1440](home-dark-1440.png) | [light 1440](home-light-1440.png) | [dark 390](home-dark-390.png) | [light 390](home-light-390.png) |
| Training | [dark 1440](training-dark-1440.png) | [light 1440](training-light-1440.png) | [dark 390](training-dark-390.png) | [light 390](training-light-390.png) |
| Performance | [dark 1440](performance-dark-1440.png) | [light 1440](performance-light-1440.png) | [dark 390](performance-dark-390.png) | [light 390](performance-light-390.png) |
| Coach | [dark 1440](coach-dark-1440.png) | [light 1440](coach-light-1440.png) | [dark 390](coach-dark-390.png) | [light 390](coach-light-390.png) |
| Goals | [dark 1440](goals-dark-1440.png) | [light 1440](goals-light-1440.png) | [dark 390](goals-dark-390.png) | [light 390](goals-light-390.png) |
| Races | [dark 1440](races-dark-1440.png) | [light 1440](races-light-1440.png) | [dark 390](races-dark-390.png) | [light 390](races-light-390.png) |
| Recovery | [dark 1440](recovery-dark-1440.png) | [light 1440](recovery-light-1440.png) | [dark 390](recovery-dark-390.png) | [light 390](recovery-light-390.png) |
| History | [dark 1440](history-dark-1440.png) | [light 1440](history-light-1440.png) | [dark 390](history-dark-390.png) | [light 390](history-light-390.png) |
| Settings & data | [dark 1440](settings-data-dark-1440.png) | [light 1440](settings-data-light-1440.png) | [dark 390](settings-data-dark-390.png) | [light 390](settings-data-light-390.png) |

Additional 375px captures are included for every screen/theme. `viewport-dark-*`
images show the initial Home viewport without full-page expansion.

## Interaction evidence

- Dark: [hover](button-dark-hover-1440.png), [pressed](button-dark-pressed-1440.png), [focus](button-dark-focus-1440.png), [disabled](button-dark-disabled-1440.png).
- Light: [hover](button-light-hover-1440.png), [pressed](button-light-pressed-1440.png), [focus](button-light-focus-1440.png), [disabled](button-light-disabled-1440.png).

Disabled captures are a temporary native-disabled CSS fixture on the real Home
CTA; no product disabling rule was added. `results.json` records computed styles
for each state, width and theme. The normal state appears in Home screenshots.

Automated checks cover navigation/rendering of all nine screens in both themes,
Home → Training CTA, Why disclosure, chart selection toggles, theme switching,
no horizontal overflow, action above fold, mobile Escape/focus return, synthetic
backup download/change-import/restore and zero console/page errors.

Live integrations, athlete data, Safari and native Electron are outside this
synthetic browser run. No merge, deployment or Mac installation was performed.
