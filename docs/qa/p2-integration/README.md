# Combined P2 integration browser evidence

Verified code and runner: `b7fcc6d58831fc8e11ce7460d29d79f8aa417f2b`.
Includes PR #9 `b93ba07` and PR #11 `c7daa88`, plus the API prefix fix.
Captured with disposable Chromium and synthetic records, Vite at 127.0.0.1:5174.

PASS: all nine screens in dark/light at 1440×900, 390×844 and 375×844;
no overflow or browser console/page errors; synthetic backup round-trip;
browser-exported snapshot POST 200, legacy GET 409, missing evidence 409,
cross-origin POST 403. See `results.json` for computed button states and checks.
No live provider or athlete data. No native Electron/Safari certification.

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
