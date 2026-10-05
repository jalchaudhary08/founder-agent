# Context Router 2.0

## Purpose
Select the smallest repository context and tool set needed for each task.

## Routes

- **status**: MEMORY/STATE.md only; no tools; very small output budget.
- **general**: MEMORY/STATE.md only; no tools.
- **decision**: MEMORY/STATE.md + CORE/DECISION_ENGINE.md; no tools.
- **research**: MEMORY/STATE.md + web_search only.
- **write**: MEMORY/STATE.md + CORE/APPROVAL_GATES.md + GitHub tools.
- **mission**: mission state/schema/product context + only the tools required by the mission.

## Rules
1. Do not load AGENT.md on every request.
2. Do not expose web_search to tasks that do not need current web research.
3. Do not expose GitHub write tools to tasks that do not need repository changes.
4. Keep recent history bounded by route.
5. Keep context files bounded by character limits.
6. Mission 002 remains capped at five new prospects per execution.
7. Usage telemetry must remain visible and truthful.
8. If routing is uncertain, prefer the smaller route and use a read tool only when evidence is actually needed.

## Why
Tool schemas and tool results are part of model input. OpenAI's Responses API reports input/output/total token usage, so reducing unnecessary context and tool definitions directly reduces request size.