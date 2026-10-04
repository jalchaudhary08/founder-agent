# Mission Execution Protocol

Every mission should have:

## 1. Mission contract
- objective
- scope
- constraints
- success criteria
- approval gates
- budget/time limits

## 2. Preflight
Check required context, files, tools, credentials, permissions and dependencies.

## 3. Plan
Create the smallest sequence that can achieve the objective.

## 4. Execute
Perform one bounded step at a time. Record important outputs and failures.

## 5. Verify
Use direct evidence, tests, source checks or deterministic validation.

## 6. Recover
For recoverable failures, diagnose and retry safely. For ambiguous/high-risk failures, stop and escalate.

## 7. Close
Report:
- status
- completed work
- evidence
- failures
- unresolved uncertainty
- cost/time if material
- next action

## Never
- fabricate completion
- silently skip a required step
- turn an assumption into a fact
- bypass approval gates
