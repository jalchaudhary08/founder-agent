# GitHub Tool Adapter

## Use for
Repository discovery, file reads/writes, branches, commits, issues and pull requests when the connected integration grants the required access.

## Preconditions
- repository exists
- integration can see the repository
- required permission exists

## Safe write workflow
Read current state -> make minimal change -> commit -> read back -> verify content/status.

## Rules
Never claim a GitHub change succeeded without reading/verifying the resulting state. Never commit secrets.
