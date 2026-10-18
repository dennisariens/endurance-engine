# Personal Beta client verification — 18 October 2026

Implemented code: `ca5a840af7a049f1099038776ce7cc83ad87cc05`.
Base: PR #12 `488062fb706235dd08f18ea4cac8912a01844a5b`.
Branch: `codex/aerion-13-personal-beta`. Subsequent evidence-only commit is the
published draft PR head. All checks below ran against the final code working tree
committed as ca5a840; no product changes follow in the evidence commit.

| Check | Actual result |
| --- | --- |
| `npm test -- --maxWorkers=2` | 341 PASS, 60 files; final unrestricted loopback-capable run 10.13s |
| `npm run typecheck` | PASS |
| `npm run build` | PASS, Vite 8.0.10, 2,372 modules |
| `node scripts/qa-personal-beta.cjs` | PASS; desktop 1440/1280 and mobile 390; 14 scenario checks; zero page/console errors, no horizontal overflow |
| `npm run qa:browser` | PASS; local V3, all nine screens at 1440/390/375, dark/light, source API/backup import/export/restore, Why disclosure, keyboard/focus and control states; zero errors/overflow |
| `git diff --cached --check` | PASS before implementation commit |
| Server/schema diff against pinned base | Empty |

Runtime: Node 24.13.1 on this iMac, React 19.2.5, Vitest 4.1.5,
Playwright 1.58.2, Chromium 145.0.7632.6. No native Safari/device execution.
Dependencies reused from the existing repository node_modules without modifying
that checkout. The reuse symlink and pre-existing case-colliding architecture
worktree difference are uncommitted/excluded. No private profiles used.

The first sandboxed final-suite run failed with EPERM for existing real HTTP
listeners; rerun with localhost access passed all 341 tests. One attempted local
V3 QA run collided with the hosted QA listener; it was rerun successfully after
the hosted runner closed. Early browser-fixture/test-selector issues were fixed
before the reported successful final run. No application failure is waived.

[Hosted scenario results](qa/results.json) · [Local V3 results](qa/local-v3-results.json)
· [Desktop synthetic capture](qa/desktop.png) · [Mobile synthetic capture](qa/mobile.png).
The inherited V3 runner records `git HEAD` in its source field; it therefore names
488062f during the pre-commit working-tree run, not an untouched baseline test.
The code under test is the implementation identified above.

## Scope and limits of evidence

The browser talks through actual loopback HTTP to the documented synthetic
cookie/CSRF/state fixture. Three isolated browser sessions share a canonical
fixture ledger. Verified login/load gates with no defaults upload, owner-selected
backup preview/confirm, two-session CAS conflict preservation/export/resolution,
mobile constraints/write/reload and desktop refresh, uncertain committed response
retry without a second commit, offline editing pause/reconnect, session expiry
with hidden athlete UI and preserved/reviewed edits after reauthentication,
independent repeated provider sync with one unique activity/load, no hosted
localStorage writes, denied anonymous HTTP reads/writes, canonical export and
explicit restore into empty state, goal edit visible on mobile after reload,
and Settings Sync now → authenticated POST → canonical GET.

This does not verify Hermes' implementation. API response/header reconciliation
is required before the two branches work as a combined release. The fixture uses
HTTP and memory, not production cookie hardening or PostgreSQL. It proves client
behavior against the explicit contract, not production server security, database
restart persistence, actual duplicate quarantine or live Intervals auth.

Physical iPhone Safari off home Wi-Fi, a second actual host, private HTTPS,
Namecheap Passenger/reverse-proxy behavior, owner-scoped PG/security tests and
encrypted backup/rollback remain integration/release blockers. Shared state edits
are full-snapshot CAS with explicit overwrite review, not field-level merging.
Pending edits live only in tab memory and can be exported; no durable offline queue.

Production web defaults to hosted mode and fails at the login/load gate without
a functioning server; local/packaged Mac behavior remains opt-in/unchanged.
No deployment, account creation, charges, exposed ports beyond disposable
127.0.0.1 tests, merge, real-data migration or active Mac installation occurred.
No redesign, provider OAuth expansion, SaaS, PWA or push scope was added.
