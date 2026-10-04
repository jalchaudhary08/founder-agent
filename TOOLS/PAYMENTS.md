# Payments Tool Adapter

## Purpose
Support payment and billing workflows when an approved payment provider integration is available.

## Requirements
Before implementing billing:
- verify current provider capabilities
- verify supported country/entity setup
- verify pricing/fees
- define webhook/event handling
- define entitlement state
- define refund/cancellation behavior

## Security
Never store raw payment credentials or card data in the agent repository.

## Approval
Spending money or changing live pricing requires the relevant approval gate.
