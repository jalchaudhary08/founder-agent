# Runtime Context Map

## Always load
- AGENT.md
- MEMORY/STATE.md

## Load when relevant
- CORE/DECISION_ENGINE.md
- CORE/ORCHESTRATOR.md
- CORE/APPROVAL_GATES.md
- CORE/ERROR_RECOVERY.md
- CORE/QUALITY_STANDARD.md
- relevant SKILLS file
- relevant TOOLS file
- relevant MISSION file
- relevant PRODUCT file
- MEMORY/DECISIONS.md
- MEMORY/PROJECTS.md
- MEMORY/LEARNINGS.md

## Context rule
Do not dump the entire repository into every model call. Select context based on the task.

## Conflict rule
More specific project/mission instructions can add constraints but cannot override AGENT.md safety, truthfulness or approval requirements.
