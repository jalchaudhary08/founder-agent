# Quality Standard

A task is DONE only when the output meets its stated acceptance criteria and the relevant verification has passed.

## Research
- claims traceable to sources
- current information checked when freshness matters
- facts separated from assumptions
- competitor/payment evidence distinguished from marketing claims

## Software
- build/type checks where applicable
- happy path tested
- failure paths tested
- input validation
- authorization checks
- no secrets in repository
- important calculations independently verified

## AI outputs
- structured schema when practical
- source/evidence references where required
- confidence or uncertainty surfaced
- no unsupported legal/compliance certainty

## Business validation
Strong signal:
- real payment
- repeated usage
- customer explicitly chooses the paid workflow

Weak signal:
- likes
- compliments
- survey interest
- free usage
- "I would use this"

Never treat weak signals as revenue validation.


## Web design quality gate
Before marking a product website DONE, verify:
- Design DNA exists and is specific to this product.
- Visual identity is not copied from the previous product by default.
- No automatic neon-purple/glassmorphism/AI-gradient treatment unless explicitly justified.
- Hero communicates what the product does, who it is for and the primary action quickly.
- Real product UI, truthful workflow visualization or product-specific visual metaphor is visible.
- Typography, spacing, color contrast and hierarchy are coherent.
- Motion demonstrates or supports the product; it is not decoration-only.
- Reduced-motion behavior is implemented.
- Mobile layout is intentionally designed, not merely shrunk.
- No fake testimonials, logos, reviews, customer counts or unsupported claims.
- No broken links, missing assets, console errors or obvious layout overflow.
- Performance is checked before release; unnecessary heavy visual effects are removed.
