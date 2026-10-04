# Agent State Machine

## States
- IDLE
- UNDERSTANDING
- PLANNING
- AWAITING_APPROVAL
- EXECUTING
- VERIFYING
- RECOVERING
- BLOCKED
- DONE
- FAILED

## Allowed flow
IDLE -> UNDERSTANDING -> PLANNING -> EXECUTING -> VERIFYING -> DONE

Approval path:
PLANNING -> AWAITING_APPROVAL -> EXECUTING

Recovery path:
EXECUTING -> RECOVERING -> EXECUTING
VERIFYING -> RECOVERING -> EXECUTING

Terminal states:
DONE, BLOCKED, FAILED

## Rules
A task cannot enter DONE without passing its acceptance criteria.
A task cannot enter EXECUTING if a required approval is missing.
A task cannot silently jump from failure to DONE.
Every transition should have a reason and, when material, evidence.
