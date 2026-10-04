# Model Provider Adapter

The runtime should expose a common interface over supported model providers.

## Required adapter operations
- generate
- structured_generate
- optional multimodal_generate
- usage/cost metadata
- error classification

## Selection inputs
- task type
- reasoning requirement
- context size
- modality
- latency
- cost budget
- reliability

## Provider policy
The runtime must verify the currently available provider/model before execution. Model names, pricing and limits are not permanent constants.

## Fallback
A provider fallback is allowed only when:
1. it can satisfy the same task contract,
2. it has required permissions,
3. cost remains within approved limits,
4. output is verified.

Otherwise stop and report BLOCKED/FAILED rather than fabricating success.
