# Claude Rules

This repository is used for a hackathon. The commit history is part of the
deliverable and may be reviewed by judges.

## Operating Principle

This is a solo hackathon project. Optimize for a demo that can be shown
reliably, not for a complete product. Protect the user's time, the demo path,
and the ability to roll back.

## Required Git Discipline

- Agents are allowed to run `git add` and `git commit` automatically after
  completing a coherent change.
- Use the shared git author name `wentianning` for commits in this repository.
- Commit messages must be written in Chinese.
- After making any code change, create a git commit before finishing the task.
- Keep each commit focused on the completed change.
- Use a clear Chinese commit message that explains what changed.
- Before committing, run the relevant checks or tests when they exist.
- Commit promptly at every stable checkpoint; do not leave finished work
  uncommitted while moving on to the next task.
- If no code was changed, state that no commit is needed.

## Attempt Limits

- Do not keep trying indefinitely. For any single bug, integration, or feature
  path, make at most 3 implementation attempts.
- An implementation attempt means: change code, run the smallest relevant
  verification, and inspect the result.
- After 2 failed static guesses, stop guessing and add runtime evidence such as
  logs, debugger output, a minimal reproduction, or a focused test.
- If 3 attempts fail, stop editing code. Report the blocker, what was tried,
  the current evidence, and the safest next move: mock, rollback, simplify, or
  ask the user for a decision.

## Version Control And Rollback

- Keep the demo path recoverable at all times.
- Whenever the main demo flow works, commit it immediately.
- Before risky changes, make sure there is a known-good commit to return to.
- When a stable demo is reached, create or update a clear tag such as
  `demo-ok` or `demo-ok-YYYYMMDD-HHMM`.
- Avoid broad refactors during the hackathon unless they directly protect the
  demo path.
- In the final stretch before a demo, prefer bug fixes, fallbacks, content, and
  deployment stability over new features.

## Mock-First Demo Path

- Define the smallest end-to-end demo path before building real integrations.
- Build the complete flow with mock or canned data first.
- The mock result must be good enough to continue the demo, not a placeholder
  that breaks downstream screens.
- Replace mocks with real services one module at a time.
- After each real integration is added, verify that the full demo path still
  works and commit the working state.
- Every external call used in the demo path needs timeout handling and a
  fallback value that lets the demo continue.

## Bug Triage Rules

- Distinguish symptoms from root causes before making broad changes.
- Ask: "Is this the whole cause, or only one cause?" before declaring a bug
  fixed.
- Check the commit-prep questions before each commit:
  - Contract closure: is the new function actually called?
  - Symmetry: do failures and catch paths have usable fallbacks?
  - External timing: does success mean the side effect really happened?
- If a bug threatens the demo timeline, choose the fastest safe path: fallback,
  mock, rollback, or cut scope.
