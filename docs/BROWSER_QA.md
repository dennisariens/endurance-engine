# Repeatable AERION browser QA

Use Node 24 in an isolated checkout. No live athlete data or existing browser
profile is used. The runner starts Vite itself on an available local port,
creates new browser contexts, blocks live sync and external requests, and seeds
only synthetic records. It closes its server/browser and cleans its temporary
browser extraction directory after each run.

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run qa:browser
```

Linux uses the exact npm-packaged Chromium version in the lockfile. This avoids
dependence on a separate browser-download CDN. Archives are extracted without
changing ownership, the full executable length is checked, and fontconfig is
configured explicitly. Browser and Vite run in the same execution environment.

On macOS, install Playwright's browser once before the QA command:

```sh
npm run qa:browser:install
npm run qa:browser
```

`AERION_QA_BROWSER` can specify an installed Chromium executable. This creates
a new disposable profile; it does not attach to your normal browser.

Outputs in `artifacts/v3-qa/`: full-page and viewport Home screenshots, light
mode, Training, synthetic downloaded backups and `results.json`. Artifacts are
ignored by Git. The PR workflow uploads them for 14 days; no secrets are needed.
GitHub-hosted execution must be verified separately from a local successful run.

Checks: desktop1440×900, mobile390×844 and375×844; no horizontal overflow; Today
action above fold; Why disclosure; dark/light toggle; all nine navigation screens;
actual backup download, changed import, restore; mobile dialog Escape and focus
return; uncaught page errors. Reduced-motion preference is enabled throughout.
This does not certify every keyboard route, every chart, or native Electron UI.

Before/after: create a separate worktree at the baseline, supply its path with
`AERION_QA_ROOT`, set `AERION_QA_BASELINE=1`, and choose a different
`AERION_QA_OUTPUT`. Both versions receive the same synthetic records. Never point
this at a running personal browser profile or the active Mac installation.

Troubleshooting: the original CDN download returned a195-byte HTML error page;
the cloud browser could not reach this execution environment's localhost. Those
are avoided by this local runner. Fontconfig must retain system font aliases:
without them the packaged browser crashed or substituted serif faces. Failures
must remain failures; do not remove assertions to make a report pass.
