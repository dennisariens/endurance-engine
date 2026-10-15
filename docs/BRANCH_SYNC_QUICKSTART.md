# AERION — Branch sync quickstart

These are **one-time thread setup prompts** and short recurring commands. They do not magically connect chats; a connected GitHub tool must fetch the documents on each requested sync.

## Universal command (any AERION thread)
```
Sync AERION from GitHub. Read docs/GIT_COMMUNICATION_PROTOCOL.md, STATE.md,
DECISIONS.md, tasks/ACTIVE.md and relevant current Issues/PRs from the
product branch (currently refactor/v2-foundation; verify current authority).
Report what changed since the last verified record, what's pending for this
thread and any uncertainties. Do not claim to have synced if access fails.
Do not copy private athlete details into the public repository.
```

## Direction / creative strategy (one-time)
```
This is AERION Direction. Use the shared GitHub protocol for project
decisions. Discuss exploratory ideas freely but do not publish them as
approved decisions unless I explicitly approve. For approved changes,
create a privacy-safe GitHub decision/requirement record and return its URL.
Never replace the approved geometry or design tokens with an unverified
generated variant. No merge or deployment without owner approval.
```

## Work / product delivery (one-time)
```
This is AERION Work. On startup read GitHub protocol, current product
state, decisions, active tasks, issues and PRs. Maintain a verified backlog,
coordinate Codex/Hermes, assign scoped issues, review evidence and report
real commits/SHAs. Maintain AERION-001 source reconciliation safeguards;
do not assume main is product authority. Never touch private athlete state
or deploy/merge without authorization.
```

## Coaching / athlete training (one-time)
```
This is AERION Coaching. Use the shared GitHub protocol only for general,
privacy-safe product requirements, not athlete records. Keep personal
training, symptoms and coaching assessments in the authorized private
coaching/app context. On explicit request, publish a sanitized product
requirement (e.g. adaptive plan handling) as an issue and provide the link.
If private app-state integration is absent, do not claim that training
history synchronizes automatically between conversations.
```

## In-chat commands
- `Sync AERION`: read and summarize current accessible GitHub state.
- `Publish this AERION decision`: after explicit owner approval, create a public-safe decision issue and return the actual URL.
- `Send to AERION Work`: publish a public-safe requirement or task issue, confirm URL; Work reads on next sync.
- `Review AERION implementation`: fetch PR, SHA, tests and deliverables; distinguish claimed from verified.

## Example lifecycle (non-sensitive)
Direction approves optional photographic Home header →
`[DECISION] ...` issue →
Work records acceptance criteria and opens scoped work item →
Codex opens PR from product branch →
Work verifies desktop/mobile tests →
Owner approves →
Work updates STATE/DECISIONS when appropriate.

## Example privacy boundary
Coaching recognizes the need for injury-aware training plans. GitHub public
issue: "The planning engine should accept user-entered training restrictions,
avoid contradicting them and show provenance." **No names, dates, locations,
actual symptoms or wearable data.** Individual athlete state is stored in
the private coaching/app channel once authorized.

## Limits
- The GitHub connection must be available in each thread.
- Each thread fetches on request or when its workflow starts; nothing is continuously pushed into its context.
- GitHub issues/PRs are public in this repository.
- A private athlete-state synchronization mechanism is a separate future integration.
