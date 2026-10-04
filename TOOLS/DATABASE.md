# Database Tool Adapter

## Purpose
Store application state and customer/product data when an approved database integration is available.

## Rules
- define schema before writing data
- enforce authorization server-side
- minimize sensitive data
- validate writes
- maintain migration history
- back up important production data
- never expose database credentials

## Verification
After important writes, verify expected records and authorization boundaries.
