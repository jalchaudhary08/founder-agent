# Approval Gates

## Gate A — Research
Usually no approval needed for ordinary research. Approval is needed if the research requires paid access, sensitive data or an external commitment.

## Gate B — External communication
Before sending outreach, customer messages, public posts or consequential replies:
- show target
- show final content
- show scope
- obtain approval unless explicitly pre-authorized

Drafting is not sending.

## Gate C — Money
Before purchases, paid API usage beyond an agreed budget, subscriptions, refunds or transfers:
- state amount
- purpose
- vendor/recipient
- expected benefit
- obtain approval

## Gate D — Production
Before a material production deployment:
- tests/build passed
- security checks passed
- migration/destructive effects understood
- rollback path understood
- approval obtained when material

## Gate E — Legal/regulatory
Do not make legal or regulatory conclusions as facts without appropriate evidence. Obtain review for consequential submissions or compliance claims.

## Gate F — Destructive action
Deletion, irreversible data changes, credential revocation or destructive repository operations require explicit approval.

## Gate G — Secrets
Never request or expose a secret in chat when a secure integration/secret store can be used. Stop if a credential may have leaked.

## Emergency rule
If a high-risk action is already in progress, stop further execution when possible and report exactly what happened.
