# AERION V3 — Relaunch delivery roadmap and morning coordination brief
**Prepared:** 2026-10-15 · **Owner:** AERION Main (direction) · **Execution coordinator:** AERION Work  
**Status:** ready for Work intake; docs-only planning. **No app code or Mac mini files modified.**

## Morning executive briefing — first read
**Mission:** Upgrade the existing local-first endurance application to the approved integrated AE Candidate B identity and a genuinely premium Breakaway-inspired coaching-first interface, without discarding engines or losing local athlete data.

**Decisions already settled**
- Integrated **AE Candidate B** identity was explicitly approved in Work, and assets are delivered in brand [PR #2](https://github.com/dennisariens/endurance-engine/pull/2).
- Yellow/lime → pink → blue gradient is vertical, restrained, with controlled depth. Brand treatment is not a gradient flood across the app.
- Build on the React/Vite/Electron product and existing state/engines. No new app or unrelated branding.
- Main handles owner product/design direction, Work delivery, Coaching personal training. Public GitHub holds ONLY public-safe product/project records.

**Current blockers**
- AERION-001 Mac mini working tree versus remote product branch remains unverified. `main` is not product authority.
- PR #2 is open/unmerged. Work must verify assets and integration strategy.
- Existing UI shows clutter/oversized text; its makeshift inline SVG mark conflicts with approved AE identity.
- `PremiumCommandDeck` fallback readiness `72` masks missing data.
- Recent PR #2 test report: typecheck/build pass; 160 passing tests, 4 failed because `sqlite3` executable unavailable in the runner. Recheck in an appropriate environment.

**Today's action plan**
1. Hermes: safe Mac inventory and real screenshot/capture; do not reset/change working tree.
2. Work: compare Mac and GitHub, establish staged product base with preserved modifications.
3. Work: accept brand PR #2 as canonical **design source** (not yet automatically merged or installed); verify geometry/export.
4. Codex: after base/source gate, implement **V3 app shell and Home** using actual AE master and existing data contracts, behind a bounded PR.
5. Work: deliver a runnable browser preview with side-by-side source-vs-V3, mobile screenshot, interaction and verification report.
6. Main: owner reviews and approves before merge/install.

## Delivery lanes — staged, with parallelism where safe

### P0 — Read-only audit and source gate (blocking)
**Executor:** Hermes on Mac; Work owns reconciliation.
- Report current branch/head/status: tracked, modified, untracked; omit filenames that could leak private data in public issue/PR.
- Preserve local data, preferences, tokens, `.env.local`; do not cat secret values.
- Compare remote product `refactor/v2-foundation` and local tracked code; produce a file-level difference map and merge strategy.
- Run existing `npm test`, `npm run typecheck`, `npm run build` without installation or mutation if possible; report blockers.
- Open current app `127.0.0.1:5174`; capture **sanitized** screenshots and describe real connectivity (Intervals sync vs fixtures vs import-only).
- Report current app icon source, packaging pathway and available AE icon assets.
**Done when:** Work has verified safe canonical source, backups/preservation plan and no destructive operations.

### P1 — Brand intake and design contract (may proceed read-only in parallel)
**Executor:** Work, with Codex for asset audit.
- Verify PR #2 path/manifest/hash and SVG shape consistency.
- Define V3 identity-vs-semantic product tokens, typography scale, accent usage and status semantics.
- Provide a Home/Training/Performance layout specification using existing component architecture and product brief.
- Verify actual A/E appearance at 16–64 px; not just vector hash.
**Done when:** Work signoffs brand and design integration contract; no new icon concept proposed.

### P2 — The actual product transformation (first visible milestone)
**Executor:** Codex after P0/P1 gate.
- Scope PR to `PremiumCommandDeck`, Home/selected shared components and V3 styles with no new backend.
- Replace inline makeshift AI/logo with approved canonical AE SVG. Preserve accessibility label and aspect ratio.
- Refine page header/navigation, spacing, typographic scale, mobile responsiveness, semantic colour tokens.
- Build one dominant coaching decision area, 72-hour timeline, primary goal and 2–4 evidence signals from derived state.
- Add unknown/estimated/unavailable states. **Remove hardcoded fallback readiness = 72**, with regression tests.
- No forced injury/personal state fixtures, hidden auto-sync claims or silent modifications of training data.
**Done when:** Live runnable Home V3 behaves correctly on desktop/mobile with actual data and honest empty states. Work provides direct preview and screenshots.

### P3 — Secondary screens with one identity (second milestone)
**Executor:** Codex, Work review.
- Training, Performance, Recovery, Goals/Races, AI Coach, history and data/settings.
- Reuse existing screen/data contracts, reduce dashboard clutter, charts with real units and source freshness, consistent spacing and status semantics.
- Flexible session UX only if underlying engine supports it; otherwise explicitly queue domain work and write tests.
**Done when:** No visually orphaned screen, nav coherent, desktop/mobile verified, zero regression in local data.

### P4 — Product reliability / app package (release candidate)
**Executor:** Hermes + Codex, coordinated by Work.
- End-to-end sync/import and local data preservation, Electron icon wiring, dock/size proof, light/dark, privacy/security, accessibility, perf and error handling.
- Validate `npm test`, typecheck, build; resolve/attribute sqlite dependency before release.
- Cross-device proofs, no fake values, release notes and rollback instructions.
**Done when:** owner approves merge/install/deploy and verified delivery is documented.

## Distinct handoff responsibilities
**Work:** orchestrate all phases, create/task scoped PRs, police design lineage, integrate feedback; do not invent third design or claim Mac state without Hermes proof.

**Codex:** reuse app and brand packages; author implementation/tests; verify branch/commit; avoid giant rewrite; provide before/after screenshots and concise discrepancy notes.

**Hermes:** inventory Mac safely, establish real local runtime and screen recordings, protect local state, run smoke tests and assist eventual app packaging; do not force-push/reset or overwrite the existing app.

## Daily morning status format (Project, public-safe)
1. **What changed since yesterday:** issues/PRs/commits verified from GitHub.
2. **Current build:** last verified local/remote app head and screenshot evidence, not a claim from stale chat memory.
3. **Today’s one deliverable:** exactly one tangible reviewable output.
4. **Three blockers max:** blocker / owner / next action.
5. **Approvals needed:** only when truly needed for next step.
6. **Codex queue / Hermes queue:** one scoped task for each, links and acceptance.
7. **Privacy:** no individualized workout/health/medical data in public records.

**Optional:** existing `npm run briefing:context` is a *private app coaching context* endpoint; never paste its raw output into public GitHub issues or CI logs. It is not the same as this public-safe engineering morning brief.

## No-go conditions
- Work or Codex replaces logo with a newly generated AE;
- local Mac files reset/overwritten;
- `main` assumed current;
- fake readiness/HRV metrics;
- brand gradient used as status/heat map everywhere;
- copied Breakaway/ECRO UI;
- no tested mobile layout;
- app icon installed or production deployed without owner review;
- test failures described as success without explanation.
