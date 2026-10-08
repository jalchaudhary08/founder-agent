# Experiment 05 — Accounting Close Exception Monitor

Status: BUILDING

## Problem
Bookkeepers and small accounting teams repeatedly review transaction exports during month-end close. Duplicate-looking entries, missing fields, unreconciled items, unusual amounts and sudden account/category changes can hide in large CSVs.

## Wedge
A close-control exception desk, not an accounting chatbot and not a replacement for a bookkeeper. It finds review-worthy exceptions and shows the evidence that caused each flag.

## Target customer
Bookkeepers, fractional finance teams, small accounting firms and operators doing recurring month-end close work.

## MVP
1. Upload a transaction CSV.
2. Verify payment before real transaction data is processed.
3. Normalize common transaction fields.
4. Detect duplicate-looking transactions, missing dates/accounts/amounts, unreconciled status signals, unusual amounts, and suspicious category/account changes when the export contains enough evidence.
5. Return severity, evidence, confidence/context and recommended review action.
6. Show a close summary: rows checked, exceptions, high-priority exceptions and data-quality gaps.

## Paid test
First output: $10–20 close exception check.

## Premium hypothesis
$39–99/month for recurring close checks, history, account rules, anomaly baselines, multiple clients/entities and review workflows.

## Non-goals
- Posting or editing accounting entries
- Tax advice
- Audit opinion
- Guaranteed fraud detection
- Replacing QBO/Xero/ERP
- Bank reconciliation certification
- Automatic deletion or correction of transactions

## Trust
Every exception must point to observable transaction data. An anomaly is a review signal, not proof of fraud or error. Never invent accounting facts. Preserve the original values in evidence only as needed and do not expose unnecessary transaction data.
