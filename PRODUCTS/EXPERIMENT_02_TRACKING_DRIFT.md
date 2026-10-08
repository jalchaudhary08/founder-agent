# Experiment 02 — Shopify × Ads Tracking Drift Detector

## Status
BUILDING

## Core hypothesis
Small Shopify brands, media buyers and agencies will pay for a fast reconciliation check when ad-platform conversions disagree with Shopify orders.

## Wedge
Not another analytics dashboard. The product answers one painful question:
"Are my ad conversion numbers drifting away from what Shopify actually recorded?"

## MVP flow
User provides a Shopify order export and an ad-platform conversion export.
The tool normalizes the two datasets, compares conversion counts/value, detects material drift, explains likely causes, and produces a prioritized fix list.

## First paid output
~$1 diagnostic.

## Premium hypothesis
$29–59/month for recurring reconciliation, anomaly history, alerts and client/store monitoring.

## Evidence-first rules
- Never invent a mismatch.
- Show source rows/aggregates used for every finding.
- Clearly label assumptions and unmatched records.
- Do not claim attribution truth when source exports cannot prove it.
- Never expose customer data unnecessarily.

## MVP findings
- conversion-count drift
- revenue/value drift
- duplicate-looking conversions
- missing/late conversion signals when evidence exists
- unusually large platform-vs-Shopify delta
- next diagnostic/fix action

## Non-goals
- full BI dashboard
- ad buying
- guaranteed attribution
- replacing Shopify or ad platforms
- enterprise data warehouse

## Validation gate
2–3 genuine unrelated payments = strong signal.
1 = refine and retest.
0 = diagnose/pivot.
