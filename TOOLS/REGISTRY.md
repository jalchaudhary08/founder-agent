# Tool Registry

This file describes how the agent should maintain its live tool map.

## Registry entry
For every connected tool/integration record:
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
