# Codex Execution Plans for This Repository

For complex features, significant refactors, multi-service integrations, migrations, billing/auth changes, or production releases, create an ExecPlan under `docs/execplans/`.

An ExecPlan is a living executable specification.

## Rules

- It must be self-contained.
- A developer unfamiliar with chat history must be able to continue from the plan and repo.
- Update it as work proceeds.
- Record discoveries, failures, and decisions.
- Do not ask for next steps while a defined milestone remains executable.
- Resolve ordinary ambiguity from repository evidence, connected services, tests, and official docs.
- Record human-only blockers without abandoning independent milestones.
- Every milestone needs executable acceptance criteria.
- "Code written" is never an acceptance criterion.

## Required structure

# <ExecPlan title>

## Purpose and user-visible outcome

## Current state

## Scope

### In scope
- ...

### Out of scope
- ...

## Architecture and dependency path

Trace user action → identity → authorization → server logic → database/provider → persistence → response → UI.

## Acceptance criteria

Use executable behavior statements.

## Milestones

### Milestone 1 — ...
**Work**
- ...

**Verification**
- exact commands/tool calls/behavior

**Status**
NOT STARTED | IN PROGRESS | BLOCKED | COMPLETE

## Progress log

## Discoveries

## Decision log

## Security and data review

## Failure and rollback plan

## Final evidence
