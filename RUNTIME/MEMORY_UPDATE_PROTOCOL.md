# Automatic Memory Update Protocol

## Goal
Preserve verified project state without treating every assistant sentence as durable memory.

## Flow
1. Complete a task.
2. Record its route, status, evidence and next step.
3. Build a memory candidate from those verified runtime facts.
4. Keep only durable project facts.
5. Require the existing Founder approval gate before saving a candidate to repository memory.
6. Read back and verify any approved save.
7. If approval is absent, report the candidate as not persisted.

## Candidate
task
route
status
durable_facts
evidence
next_step
persistence

## Rules
- Evidence outranks generated wording.
- Do not invent durable facts.
- Do not silently overwrite memory.
- A candidate is not the same as a saved memory update.
