# Founder Agent App Architecture

## Client
Phone-first web UI.

## Server/runtime
A secure server-side runtime should:
- authenticate the founder
- load repository context
- call model providers
- execute permitted tools
- enforce approval gates
- verify results
- write durable state

## Storage
Use a database for sessions/task state when needed. GitHub remains the source repository for agent documents, not a live secret store.

## Deployment
Deployment provider can be selected after implementation requirements are fixed.

## Security boundary
Browser never receives provider API keys, GitHub tokens or other server secrets.
