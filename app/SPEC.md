# Founder Agent App Specification

## Primary screen
1. Header: Founder Agent
2. Conversation area
3. Composer: text input + send
4. Task status card
5. Approval card when needed
6. Result/evidence section

## Example
Founder:
"Start Mission 002."

Agent:
"Mission 002 is ready. I will inspect existing prospect data, research missing prospects, verify evidence and prepare the top 10. I will not send outreach without your approval."

## Approval interaction
The user sees:
- action
- scope
- cost
- risk
- exact communication content when applicable
- Approve / Reject

## Status
Use:
IDLE, WORKING, AWAITING_APPROVAL, VERIFYING, DONE, BLOCKED, FAILED.

## Privacy
Do not expose API keys or internal credentials in the UI.
