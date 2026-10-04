# Tool Registry

This file describes how the agent should maintain its live tool map.

## Registry entry
- name
- category
- capabilities
- required inputs
- authentication/permissions
- read actions
- write actions
- destructive actions
- cost/limits if known
- verification method
- current status
- last verified date/context

## Capability matching
Never select a tool only from its brand name.

Match:
required capability + input/output fit + permission + reliability + cost + risk.

## Tool state
Use:
- AVAILABLE
- LIMITED
- UNAVAILABLE
- NEEDS_AUTH
- NEEDS_APPROVAL
- UNKNOWN

UNKNOWN means the capability must be checked before relying on it.

## Freshness
Exact pricing, model names, API behavior, limits and product availability are time-sensitive. Re-check current documentation when material.

## Failure rule
If the preferred tool fails, do not silently substitute a different behavior. Choose a fallback only if the fallback preserves the required outcome and record the substitution.

## Phase 2 live map

### GitHub repository adapter
- category: repository
- capabilities: read files; safe update existing files with optimistic-concurrency verification
- required inputs: repository path; for writes, expected blob SHA + commit message + content
- authentication: public reads may work without a token; writes require GITHUB_TOKEN
- read actions: available
- write actions: available in adapter, gated by token
- destructive actions: unavailable
- verification: mandatory read-back after writes
- current status: LIMITED
- reason: model/orchestrator tool-calling integration is not yet connected