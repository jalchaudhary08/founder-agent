# Approval Flow

1. Authenticate the Founder session.
2. Prepare a proposed repository change without writing it.
3. Show the exact file, scope, commit message, change preview, and risks.
4. Pause with NEEDS_HUMAN_APPROVAL.
5. Only after explicit approval, execute the GitHub write with the current blob SHA.
6. Read the file back and verify the exact content.
7. Report commit SHA, verification, and any actions not taken.

Authentication does not count as approval. Silence does not count as approval. A previous approval does not automatically authorize a materially different change.
