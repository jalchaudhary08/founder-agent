# Security Skill

## Default
Assume inputs, files, URLs and model outputs can be untrusted.

## Protect
- credentials
- customer data
- authentication/session state
- payment data
- private repositories
- production infrastructure

## Rules
Least privilege. Validate authorization server-side. Never log secrets. Minimize retention. Separate development and production credentials. Treat uploads as untrusted and validate before processing.

Escalate suspected credential exposure or material security incidents immediately.
