# Approval Flow

1. Authenticate the Founder session.
2. Prepare a proposed repository change without writing it.
3. Show the exact file, scope, commit message, change preview, and risks.
4. Pause with NEEDS_HUMAN_APPROVAL.
5. Only after explicit approval, execute the GitHub write with the current blob SHA.
6. Read the file back and verify the exact content.
7. Report commit SHA, verification, and any actions not taken.

Authentication does not count as approval. Silence does not count as approval. A previous approval does not automatically authorize a materially different change.


## Phase 2 implementation

The runtime now supports a signed, short-lived approval capability for repository writes:

1. The model may call `github_prepare_write`.
2. The tool reads the current file and captures its current blob SHA.
3. The tool returns a signed approval token and a human-reviewable proposal; it does not write.
4. The phone UI renders the file, commit message, content preview, expiry, and explicit Approve/Cancel controls.
5. `POST /api/approvals/approve` requires the authenticated Founder session and a valid approval token.
6. The endpoint calls the existing SHA-checked GitHub writer.
7. The writer reads the file back and compares exact content before reporting success.

Approval tokens expire after 10 minutes. A stale repository SHA blocks the write and requires a fresh proposal. No delete action is exposed by this flow.
