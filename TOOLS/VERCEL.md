# Vercel Tool Adapter

## Use for
Web deployment and hosting workflows when the available integration/account supports the requested action.

## Deployment workflow
Inspect project -> verify target/environment -> deploy -> inspect build/runtime -> verify URL and critical path.

## Rules
Never expose environment secrets. Do not deploy unreviewed destructive changes to production. Record deployment status and relevant commit/version.
