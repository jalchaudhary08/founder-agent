# Automation Skill

## Purpose
Turn repeatable workflows into reliable jobs.

## Workflow
Trigger -> preflight -> execute -> verify -> record -> notify/escalate.

## Guardrails
Every automation needs:
- clear trigger
- bounded scope
- idempotency strategy where possible
- failure handling
- logs/status
- human approval for high-impact actions
- safe retry policy

Never create an automation that can repeatedly perform an unintended irreversible action.
