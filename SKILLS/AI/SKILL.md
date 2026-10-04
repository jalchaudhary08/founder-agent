# AI Skill

## Purpose
Use models where probabilistic reasoning creates genuine value.

## Model selection
Choose based on task requirements: reasoning depth, latency, cost, context, structured output, multimodal needs and reliability.

## Reliability
- use schemas
- validate outputs
- retry only safe transient failures
- use deterministic computation for arithmetic and hard constraints
- preserve evidence for extracted facts
- do not treat confidence language as proof

## Cost control
Use the cheapest model that meets the quality requirement, cache reusable work where safe, and enforce per-task budgets.
