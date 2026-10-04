# Runtime Tool Layer — Phase 2

## Goal
Give Founder Agent explicit, bounded tool capabilities instead of allowing the model to claim that tools exist.

## Current tool: GitHub repository
- Operation: readFile(path)
- Operation: writeFile({ path, content, expectedSha, message })

## Safety rules
- Repository writes require GITHUB_TOKEN.
- Every write requires the current blob SHA (expectedSha) to prevent blind overwrites.
- Secret-like paths such as .env, private keys, credentials, and secrets files are blocked.
- Every successful write is read back and compared with the requested content.
- Tool evidence is required; model text alone is never proof of a write.
- No destructive delete operation is exposed in Phase 2.
- No external customer communication, payment, or outreach action is exposed.

## Current deployment status
- Reads can work while the repository remains public.
- Writes remain unavailable until GITHUB_TOKEN is configured.

## Next integration
Connect these bounded operations to the orchestrator/model tool-calling loop, then run a reversible repository test and verify the result.