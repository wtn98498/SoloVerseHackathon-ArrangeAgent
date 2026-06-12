# Three-Agent Team Split

This file explains how the three implementation agents should work without
drifting apart.

## Shared Rule

Every agent starts by reading:

1. `PLAN.md`
2. `docs/contracts.md`
3. Their own brief in `docs/agent-*.md`

No one changes an API shape privately. If a contract changes, update
`docs/contracts.md` first.

## New Conversation Protocol

Every new Agent conversation must begin by declaring:

```text
Role: Frontend / App Backend / Arrangement / Integration Manager / Docs PM
Read: PLAN.md, docs/contracts.md, docs/team-split.md, <role brief>
Owns: <files, folders, or workstream>
Does not own: <areas that must not be changed without coordination>
First milestone: <smallest stable checkpoint>
Validation: <command or manual check that proves the checkpoint works>
Commit plan: Chinese commit message after the checkpoint passes
```

If the user did not explicitly assign a role, choose the narrowest role that
matches the requested task. If the task spans multiple roles, use Integration
Manager mode and coordinate through `docs/contracts.md` before touching role
implementation files.

## Role Map

- Frontend: UI, playback, user input, client state, API calls.
- App Backend: API routes, DeepSeek wrapper, validation, fallback routing.
- Arrangement: generation rules, deterministic fallback, prompts, transformers.
- Integration Manager: shared contracts, cross-role checkpoints, demo safety,
  merge order, rollback/tag decisions.
- Docs PM: plan, scope, demo script, non-code coordination docs.

Agents should keep changes inside their role boundary. Cross-role edits are
allowed only when required by `docs/contracts.md` or when the user explicitly
asks for coordination work.

## Agent 1: Frontend

Brief:

- `docs/agent-frontend.md`

Goal:

- Make the editor playable and visually convincing.

Depends on:

- `ArrangementProject`
- `SeedPattern`
- `/api/arrange/complete`
- `/api/arrange/energy`

First milestone:

- Render and play a static fixture project.

## Agent 2: App Backend

Brief:

- `docs/agent-backend.md`

Goal:

- Provide stable local APIs and DeepSeek integration.

Depends on:

- Shared contract types.
- Arrangement agent service.

First milestone:

- Return valid fallback arrangement from both endpoints with no API key.

## Agent 3: Arrangement Agent

Brief:

- `docs/agent-arrangement.md`

Goal:

- Generate valid arrangements and transformations.

Depends on:

- Shared contract types.
- Backend DeepSeek wrapper.

First milestone:

- Deterministic fallback generator that returns a valid 8-bar project.

## Integration Order

1. Arrangement agent creates fixture seed and fixture project.
2. Backend exposes fixture project through complete endpoint.
3. Frontend renders and plays backend fixture.
4. Frontend sends real seed to backend.
5. Backend routes seed to fallback generator.
6. Backend adds DeepSeek path behind same endpoint.
7. Frontend adds polish after API contract is stable.

## Anti-Drift Checklist

Before merging any workstream:

- Does it compile against the shared types?
- Does it preserve the 8-bar / 128-step rule?
- Does it keep the four required tracks?
- Does it work without `DEEPSEEK_API_KEY`?
- Does it keep the user-facing loop under 90 seconds?
