# Runtime Task Protocol

## Input
A founder message becomes a task:

- task_id
- founder_request
- project
- mission (if applicable)
- constraints
- approval scope
- created_at

## Processing
1. Load only relevant repository context.
2. Run orchestrator.
3. Determine required skills.
4. Select available tools/models.
5. Execute bounded steps.
6. Record intermediate status.
7. Verify each material result.
8. Ask for approval when a gate is reached.
9. Persist only durable state.

## Output
Every completed task returns:
- status
- result
- evidence
- assumptions/uncertainty
- actions taken
- actions not taken
- next step

## Status
DONE
PARTIALLY_DONE
BLOCKED
NEEDS_HUMAN_APPROVAL
FAILED
UNVERIFIED

## Important
A generated response is not proof that an external action occurred. External actions must have tool evidence.
