# Founder Agent Runtime

## Purpose
The runtime is the execution layer between the founder's chat request and the repository's brain.

GitHub stores the agent constitution, skills, tools, memory and missions. The runtime loads the relevant context, sends the task through the orchestrator, calls permitted tools/models, verifies results and writes durable state back when appropriate.

## Target user experience
Founder opens a phone-friendly chat interface and says things like:
- "Start Mission 002."
- "Research 10 more qualified prospects."
- "Explain what you found."
- "Prepare outreach drafts, but don't send anything."

The runtime should return a concise status plus evidence and deliverables.

## Required runtime capabilities
1. Secure founder authentication.
2. Task/session handling.
3. Repository context loading.
4. Orchestrator execution.
5. Model provider adapter.
6. Tool adapter layer.
7. Approval gate handling.
8. Verification.
9. Durable memory updates.
10. Usage/cost controls.
11. Error/recovery handling.
12. Audit log without storing secrets.

## Security rule
GitHub is not the runtime secret store. API keys and service credentials must live in secure environment variables/secrets, never in repository files.

## Current state
RUNTIME SPECIFICATION ONLY. No production agent runtime is claimed to exist yet.
