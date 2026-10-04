# Runtime Efficiency — Daily-Use Guardrails

## Goal
Founder Agent must be usable every day without repeatedly sending the entire repository brain to the model.

## Context loading
- Load AGENT.md and MEMORY/STATE.md as the base context.
- Load CORE and mission/product files only when the task matches their topic.
- Cap individual context files at 12,000 characters.
- Cap the combined repository context at 36,000 characters.
- Keep recent chat history bounded to the last 6 messages and 12,000 characters.
- Do not load unrelated skills, tools, missions, or memory files into every request.

## Model budgets
- Normal tasks: max_output_tokens 2,500 and max_tool_calls 4.
- Mission 002: max_output_tokens 4,500 and max_tool_calls 8.
- Mission 002 must process at most 5 new prospects per execution.
- Large missions must be resumable instead of one giant request.

## Token telemetry
The runtime reports:
- response input tokens
- response output tokens
- response total tokens
- cached input tokens
- current model TPM limit when supplied by OpenAI
- remaining model TPM tokens when supplied
- token reset estimate when supplied

The UI shows session usage and the latest rate-limit snapshot. This is not a monthly billing/quota figure.

## Prompt caching
Keep stable instructions and tool definitions before changing task content so supported models can reuse the prefix. OpenAI prompt caching can reduce repeated input processing, but cached tokens still count toward rate limits.

## Failure behavior
- A 429 rate-limit response is surfaced as RATE_LIMITED, not disguised as a generic server failure.
- The UI displays remaining tokens/reset information when available.
- Never blindly retry a rate-limited request.
- Reduce request size or wait for the reported reset.

## Next optimization
Move from manually replayed chat history toward Responses API conversation state or compact durable summaries, while preserving verification and approval boundaries.
