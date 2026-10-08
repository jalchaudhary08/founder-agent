# Web Design Execution Workflow

## Purpose
Make product-specific website design an executable agent workflow rather than a style preference.

## Required input
Before implementation, the agent must have:
- product name and category
- target customer
- painful recurring problem
- desired conversion/action
- evidence/trust available
- technical constraints
- known accessibility/performance constraints

## Required Design DNA artifact
Create a Design DNA using `SKILLS/WEB/DESIGN_DNA.md`. At minimum it must define:
1. audience and customer anxiety
2. product personality
3. visual metaphor
4. color roles and contrast
5. typography hierarchy
6. layout grammar
7. hero composition
8. truthful product visualization
9. interaction and motion language
10. trust/proof treatment
11. CTA hierarchy
12. mobile behavior
13. performance budget
14. reduced-motion/accessibility behavior

## Execution sequence
Research -> Design DNA -> page architecture -> visual system -> implementation -> local checks -> rendered inspection -> quality gate -> fix -> re-test -> report.

Do not skip Design DNA because implementation already exists. If an existing site is being redesigned, inspect the current implementation first and explicitly record what is being retained, removed and replaced.

## Gate semantics
Each quality-gate item is PASS, FAIL or UNVERIFIED.

- FAIL blocks DONE.
- UNVERIFIED prevents claiming full verification.
- PASS requires evidence from code, test output or rendered inspection as appropriate.

## Required final report
Report:
- files changed
- Design DNA decision
- implementation changes
- verification performed
- remaining UNVERIFIED items
- deployment status only when independently verified
