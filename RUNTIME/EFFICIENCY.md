# Runtime Efficiency — Daily-Use Guardrails

## Goal
Founder Agent must be usable every day without repeatedly sending the entire repository brain to the model.

## Context loading
- Context Router 2.0 selects files by task type.
- Status tasks load only MEMORY/STATE.md.
- Web search is disabled unless the route needs current web research.
- GitHub tools are disabled unless the route needs repository evidence or a proposed change.
- AGENT.md is not automatically injected into every request; the runtime carries a compact constitutional instruction and loads source files only when relevant.
- Individual context files are capped at 9,000 characters.
- Combined context is capped at 22,000 characters.
- Recent history is bounded by route and 7,000 characters.

## Model budgets
- Status: 700 max output tokens, no tools.
- General: 1,600 max output tokens, no tools.
- Decision: 1,800 max output tokens, no tools.
- Research: 2,200 max output tokens, web search only.
- Write: 2,200 max output tokens, GitHub tools only.
- Mission 002: 4,500 max output tokens and max 8 tool calls.
- Mission 002 processes at most 5 new prospects per execution.

## Token telemetry
The runtime reports input, output, total and cached tokens plus rate-limit headers when available. The UI shows session usage and the latest rate-limit snapshot.

## Failure behavior
- A 429 rate-limit response is surfaced as RATE_LIMITED.
- The UI displays remaining tokens/reset information when available.
- Never blindly retry a rate-limited request.
- Reduce request size or wait for the reported reset.

## Next optimization
Use Responses API conversation state or compact durable summaries instead of replaying chat history as the app grows.