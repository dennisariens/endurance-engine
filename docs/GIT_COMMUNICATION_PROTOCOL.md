# AERION — Git communication protocol (proposal v1)
Updated: 2026-10-15 · Status: **proposed, not adopted until owner-approved PR merge**.

## 1. Objective

Reduce hand-copying among AERION **Direction**, **Work**, **Coaching**, **Codex**, and **Hermes**. GitHub is the durable relay for **public-safe product/project information**; it is **not** a shared memory feed of conversations and is **not** a medical or athlete-data store.

Chats are separate. A thread must **fetch** shared state when asked/resumed; statements in another chat are not automatically imported. Writing to GitHub requires an explicit action/tool call; no unattended publishing or background watching is implied.

## 2. Repository authority and caveat

Repository: `dennisariens/endurance-engine` (currently **PUBLIC**).
Until AERION-001 source reconciliation is complete:
- Product authority: `refactor/v2-foundation` (verify live head SHA on every implementation).
- `main`: minimal placeholder with unrelated Git history. **Do not merge into or reset `main`** based on this protocol.
- Mac mini may have newer modified/untracked files. Inspect and preserve them before changes.
- Existing `AGENTS.md`, `STATE.md`, `DECISIONS.md`, `tasks/ACTIVE.md` remain current project records until deliberately reconciled.
- This protocol is proposed on a separate docs branch and does not authorize deployment, merge, destructive Git changes or new app behaviour.

## 3. Responsibility map

| Actor | Authority | Writes | Reads |
|---|---|---|---|
| Direction (Chat) | Creative intent; owner-approved design/product decisions | Decision/brief issue after owner approval; references | Current status, issues, PRs, brand specs |
| Coaching (Chat) | Individual training recommendations | **No private athlete data in public repo.** Only owner-approved anonymized product requirements | Product contracts; *private athlete state from authorized channel only* |
| Work | Product delivery coordination, requirements and reviews | Project tasks/issues, PR reviews, approved document updates | Full public project state |
| Codex | Bounded implementation | Task branches, PRs, tests, code handoff | Scoped issue, AGENTS, current branch state |
| Hermes | Local Mac runtime and integration work | Audits/test reports/PRs only after privacy check; may maintain local private data | GitHub public product tasks and local app data |

Owner approval is necessary before final logo/UX signoff, merge, deployment or release.

## 4. Where communication goes

| Content | Channel | System of record |
|---|---|---|
| Product decision / design choice | GitHub Issue: `[DECISION]` | `DECISIONS.md` after approval/PR |
| Feature request / bug / design work | GitHub Issue: `[TASK]` | Issue + acceptance tests |
| Generalized coaching-engine requirement | GitHub Issue: `[REQUIREMENT]` | Issue, *no personal evidence* |
| Code or asset changes | Feature branch + Pull Request | Git history and PR review |
| Current program status | `STATE.md` + `tasks/ACTIVE.md` | Updated via reviewed PR |
| Engineering output | PR description + `handoffs/CODEX_TO_WORK.md` or task-specific report | Commit, tests, screenshots |
| Athlete symptoms, training, wearable/health data, screenshots | Private athlete-state system | **Never public Issues, Git commits, PRs, Actions logs or screenshots** |
| Secrets, API keys, tokens | Local secrets or approved secrets manager | **Never committed, even to a private repo by default** |

An issue is a durable queue item, not approval by itself. The latest approved decision and verified implementation are authoritative, not the most recent free-form comment.

## 5. Event/issue contract

Each significant message uses GitHub issue title:
- `[DECISION] AERION-### — <short subject>`
- `[TASK] AERION-### — <short subject>`
- `[REQUIREMENT] AERION-### — <short subject>`
- `[BLOCKER] AERION-### — <short subject>`

In the body record:
```yaml
record_type: DECISION | TASK | REQUIREMENT | BLOCKER
source_role: direction | coaching | work | codex | hermes
visibility: public-product
status: proposed | approved | in-progress | blocked | verified | superseded
owner_approval: pending | approved | not-required
recorded_at: YYYY-MM-DD
affects: [brand, ui, engine, integrations, ops]  # as relevant
source_reference: link-to-issue-or-PR-or-approved-artifact
next_owner: work | codex | hermes | direction | coaching
```
Follow with brief **Context**, **Decision/Request**, **Acceptance**, **Dependencies** and **Next action**. Do not attach chat transcripts containing private data.

Issue numbers come from GitHub; never fabricate them. Resolve conflicting changes in Work and document superseded decisions.

## 6. Workflow — no manual long handoffs

1. **Resume.** Say `Sync AERION from GitHub` in the relevant connected thread. That thread fetches current `STATE.md`, `DECISIONS.md`, `tasks/ACTIVE.md`, relevant issues, PRs and this protocol from the actual product branch.
2. **Decide.** Direction/owner explicitly approves a particular decision. A thread with GitHub access publishes an appropriate sanitized `[DECISION]` issue, otherwise it reports that publication did not occur. Brainstorming is **not automatically a decision**.
3. **Route.** Work triages the issue, creates a bounded task (with dependencies and acceptance criteria), then assigns Codex or Hermes. Coaching publishes only generic feature requirements if explicitly requested.
4. **Implement.** Codex/Hermes verify the correct base ref and cleanly inventory local changes; use `codex/<task>-<slug>` or `hermes/<task>-<slug>`; open a PR targeting the **current product authority**, not placeholder `main`.
5. **Verify.** Attach exact SHA, file list, `npm test`, `npm run typecheck`, `npm run build`, desktop/mobile screenshots when UI work, limitations, security/privacy checks, and owner signoff requirements.
6. **Close loop.** Work updates the issue, the durable project state and decision log as warranted via reviewed changes. Direction/Coaching can read these on next explicit sync. No claim of success until GitHub returns a confirmed write.

**No silent execution:** a chat may summarize status only after fetching it. Every write is explicit; if GitHub access is unavailable, report the blocker instead of pretending to sync.

## 7. Privacy gate (mandatory)

**The product repository is public.** Do not publish any identifiable health/medical details, individual workouts, precise HR/power histories, injury notes, sleep/HRV, private photos, medical/dental matters, tokens or raw integration payloads. General product requirements may say `Support athlete-reported training restrictions and graded return` without naming a person or reproducing symptoms.

AERION's *private athlete state* needs an independently approved protected channel: preferred local-first app database, encrypted backups and authenticated access. A separate private GitHub repo for carefully minimized state is a possible design **only after a privacy/security decision**; private GitHub visibility alone does not make it an appropriate clinical store. Never replicate protected data just for chat convenience.

Coaching across chats is not continuously synchronized until an authorized connector to the private athlete store exists. This protocol only solves project communication.

## 8. Conflict / lifecycle rules

- A GitHub PR, not chat prose, transports code.
- Write-once GitHub issues capture rationale; amend by comments and status, never erase prior decision history.
- `STATE.md` describes implementation reality. `DECISIONS.md` describes approved intent. Do not mark an unmerged feature as shipped.
- All new advice must check existing pending changes and dependencies.
- Do not reuse stale SHAs as if current.
- Never clean/reset the Mac mini working tree without owner authorization.
- No automatic GitHub-to-ChatGPT background notifications or proactive updates promised.

## 9. Adoption gate

Work must review this proposal with Direction, verify availability of GitHub tools in each thread, align existing `AGENTS.md` and handoffs, resolve product-branch status (AERION-001), choose the private athlete-state channel and only then merge/apply the protocol. Until then: docs-only pilot.
