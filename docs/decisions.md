# Decisions

One entry per material choice. Newest at the bottom. Reference entries in commits as `D<n>`.

Template:

```
## D<n>: <decision>
- Context: what forced the choice
- Decision: what we chose
- Rejected: the alternative and why
- Evidence: data, eval result, or source
- Revisit when: the condition that would change it
```

## D1: Canonical domain is cadre.ai
- Context: the brief references cadreai.com; the live site and all service pages are on cadre.ai, and the Maturity Index lives on portal.gocadre.ai.
- Decision: allowlist `cadre.ai` and `portal.gocadre.ai` only.
- Rejected: following the brief literally, which would produce broken links.
- Evidence: discovery pre-read 2026-10-12: `https://cadreai.com` returns 301 to `https://cadre.ai/`. Contact emails use a third domain, gocadre.ai.
- Revisit when: Cadre confirms a different canonical domain.

## D2: The bot explains the AI Maturity Index but never scores it
- Context: the Index is Cadre's own assessment, grading a company across an eight-pillar framework, taken on the portal.
- Decision: describe it and link to it.
- Rejected: an in-chat "quick score", which would imitate a proprietary product without its methodology.
- Evidence: cadre.ai FAQ.
- Revisit when: Cadre exposes the assessment through an API.

## D3: Pricing questions route to a strategy call
- Context: no public pricing found on cadre.ai.
- Decision: never state figures; offer a call and capture intent.
- Rejected: ranges or "typical engagement" estimates.
- Evidence: 2026-10-12: `https://cadre.ai/pricing` returns 404 and no fetched page states a Cadre price. The only price-like fact is that the Maturity Index is free.
- Revisit when: Cadre publishes pricing or answers Q4.

## D4: Security answers come only from published statements
- Context: no security page (`https://cadre.ai/security` is 404) and no certifications anywhere. The strategy and AI engineering pages share an "LLM Selection & Data Security" block of four marketing bullets, e.g. "Black-box your data so it's never used to train other models". The privacy policy covers website visitors only.
- Decision: the bot quotes those four bullets as Cadre's stated approach, says no detailed security documentation is published, and hands security or compliance specifics to a human.
- Rejected: general claims (SOC 2, encryption at rest, data residency) not published by Cadre.
- Evidence: discovery pre-read 2026-10-12, `/strategy` and `/ai-engineering`.
- Revisit when: Cadre provides a security statement.

## D5: Chat model
- TODO(you): fill at 5:12 from the comparison table (pass rate per tier, p50 latency, cost per conversation).

## D6: Judge calibration
- TODO(you): fill at 4:48. Agreement x/10 and what you changed in the rubric because of disagreements.

## D7: The Cadre OpenRouter key enters production only after the guards are live
- Context: Cadre supplied a $5 OpenRouter key for the public demo. A public URL without a rate limit or spend breaker can drain it, and an empty key on review day means the demo is down.
- Decision: development, evals, CI and the Phase 0–2 production deploys use a personal key with a $10 limit. The Cadre key replaces it in Vercel Production (only) at the end of Phase 2, once the rate limit and daily spend breaker are verified in production. It never goes in `.env.local`, CI or a commit.
- Rejected: Cadre key in production from 0:12 (about 3 hours exposed with no limits); Cadre key for evals (Sonnet judge runs and the model comparison would spend most of it).
- Evidence: OpenRouter pricing 2026-10-12: Haiku 5.5 $0.10/$0.50 per million tokens (cached input $0.01); Sonnet 5.5 $2/$10. Estimated full Tier 1 run about $0.03 on Haiku.
- Revisit when: Cadre states the key's intended use or raises its limit.
