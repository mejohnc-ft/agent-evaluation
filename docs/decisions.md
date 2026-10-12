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

## D8: G8 smoke runs on push to main, gated on the live commit
- Context: the runbook triggered G8 on GitHub's `deployment_status` event, but Vercel creates no GitHub deployment records for this repo (2026-10-12: `GET /repos/.../deployments` returned 0), so that trigger never fires.
- Decision: `.github/workflows/smoke.yml` runs on `push` to `main` and `workflow_dispatch`. It polls `/api/version` until production serves `GITHUB_SHA` (5-minute timeout), then runs Playwright against the production URL.
- Rejected: a fixed sleep (flaky either way); `deployment_status` (never fires); a cron (doesn't tie the check to a deploy).
- Evidence: zero deployment records and no commit statuses on HEAD at 09:40.
- Revisit when: the Vercel GitHub app posts deployments for this repo; switch back to `deployment_status`.

## D9: The AI Transformation Intensive is 45 days; the construction page's 60 days is dropped
- Context: /strategy titles the Intensive "From Idea to Execution in 45 Days"; /industries/construction says Cadre "defines an AI strategy in 60 days". The baseline eval bot quoted both and called them inconsistent.
- Decision: the offering's own page wins. `knowledge/construction.md` keeps the rest of that sentence without the day count.
- Rejected: quoting both (exposes Cadre's inconsistency to prospects and gives no answer).
- Evidence: Tier 1 `strategy-intensive-length` failed on the baseline ("60 days"), passes after.
- Revisit when: Cadre confirms which figure is current.

## D10: No client or solution counts in the knowledge base
- Context: /about says "50+ companies" and "100+ high-ROI use cases"; /industries/construction says "200+ mid-market clients served" and "450+ solutions deployed".
- Decision: state none of them; the bot says it has no confirmed count and offers the team. Added to the questions for Cadre.
- Rejected: picking the larger (unsupported) or listing both (the baseline bot did this).
- Evidence: Tier 1 `company-size` failed on the baseline ("50+ companies"), passes after.
- Revisit when: Cadre gives one canonical figure.

## D11: No third-party statistics; the Anthropic banner is quoted, not upgraded
- Context: the homepage FAQ says "According to MIT, over 90% of AI initiatives fail"; /about cites "State of AI in Business 2025, MIT" for "300% higher" success with vendors; /industries/construction cites a white paper (61%, 45%, 50%, 4.4%). We can't verify those attributions from Cadre's pages, and a support bot repeating a misattributed statistic is a brand risk. The homepage banner says "Anthropic & OpenAI Partner"; only OpenAI has an announcement ("Official Service Partner", 2026-01-05).
- Decision: drop all third-party statistics and the uncited "three times more likely" claim. Quote the Anthropic banner verbatim and reserve "Official Service Partner" for OpenAI.
- Rejected: repeating the figures with "according to Cadre's site" (still spreads an unverified number).
- Evidence: Tier 1 `mit-statistic` and `anthropic-partner` failed on the baseline; both pass after (eval run 947ce5f04089, 14/14).
- Revisit when: Cadre supplies the primary sources or confirms the Anthropic relationship.
