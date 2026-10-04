# Runtime Authentication Protocol

## Goal

Protect Founder Agent runtime actions behind a server-side Founder authentication gate.

## Current implementation

- FOUNDER_AUTH_SECRET is stored only in the Vercel environment.
- The browser submits the Founder key only to the login endpoint.
- Successful login creates a signed, HttpOnly, Secure, SameSite=Lax session cookie.
- The runtime validates the cookie before serving the chat endpoint.
- Session lifetime is 12 hours.
- Invalid or expired sessions are rejected.
- The secret is never returned to the browser or stored in repository files.

## Security boundaries

- Never put FOUNDER_AUTH_SECRET in GitHub.
- Never expose it through frontend environment variables.
- Never log the key.
- Authentication does not imply approval for consequential actions.
- Repository writes still require the separate approval gate and GitHub write controls.

## Current limitation

This is a single-founder authentication layer, not multi-user identity management. It is intentionally small for the current Founder Agent MVP.
