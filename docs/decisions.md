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

## D5: Chat model is Claude Haiku 5.5
- Context: the brief's success metrics are correct, sourced answers (groundedness first), honest escalation, and cost under $0.01 per conversation.
- Decision: keep `anthropic/claude-haiku-5.5`.
- Evidence: all 33 scenarios (Tier 1 deterministic, Tier 2 judged by Sonnet 5.5, Tier 3 adversarial), prompt 8d4bdf3cdcc1, 2026-10-12; cost is OpenRouter's billed cost per scenario, model only.

  | Model | Tier 1 | Tier 2 | Tier 3 | p50 latency | Cost / scenario |
  | --- | --- | --- | --- | --- | --- |
  | anthropic/claude-haiku-5.5 | 21/21 | 6/6 | 6/6 | 3.1 s | $0.00039 |
  | openai/gpt-6-luna | 20/21 → 21/21* | 5/6 → 6/6 | 6/6 | 2.7 s | $0.00018 |
  | anthropic/claude-sonnet-5.5 | 20/21 | 4/6 | 6/6 | 4.4 s | $0.00916 |

  \*Luna's first run failed three Tier 1 assertions on curly apostrophes and one on "aren't published" (assertion fixes, commit 251bfb3) and one Tier 2 groundedness check: it said the Showing Scheduler reduces status chasing, which the KB doesn't say. The rerun passed Tier 2.
- Rejected: Sonnet 5.5 (23x the cost, slower, and its longer answers failed `concise` and once `grounded`, calling the free Maturity Index "low-cost"); GPT-6 Luna (cheaper and slightly faster, but the only model with an invented claim in this run, and groundedness outranks a $0.0002 saving).
- Revisit when: a run of 3+ repetitions shows Luna with zero groundedness failures, or traffic makes the cost difference material.

## D6: Judge calibration: 10/10 after two rubric changes
- Context: Tier 2 is scored by a Sonnet 5.5 judge; its scores mean something only if it agrees with a reference.
- Decision: 10 transcripts in `evals/calibration.yaml`: 6 real Haiku replies from Tier 2 runs and 4 synthetic failures written by Claude (invented price, invented training format, hype tone, login troubleshooting). Labels: the owner delegated labelling; synthetic items are labelled by construction, real items from Claude's claim-by-claim check against `knowledge/`. Owner decision applied: escalation judges only the handoff, and invented facts fail `grounded` (no double counting).
- Changes from disagreements: (1) `correct_escalation` no longer fails a reply that routes correctly but invents a fact; that is `grounded`'s job. (2) `concise`: about 120 words is a target, not a limit; word count alone fails only past about 200 (the judge had failed a 130-word list).
- Evidence: first run 9/10 (concise disagreement); after both changes 10/10 (grounded 9/9, answers_question 7/7, correct_escalation 8/8, tone 7/7, concise 7/7). Tier 2 on the calibrated rubric: 16/18 over three runs; both misses are genuine small groundedness slips the judge caught (describing the contents of cadre.ai's contact form; "the Departments page has more detail").
- Limitation: labels are not an independent human review; real-item labels share the author of the rubric. A second reviewer would strengthen this.
- Revisit when: the rubric, judge model or chat model changes; re-run `npm run eval:calibrate`.


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

## D12: Supabase MCP is hosted, project-scoped, and read-only outside migrations
- Context: the stdio Supabase MCP needed a personal access token in `SUPABASE_ACCESS_TOKEN` (never set) and ran `--read-only`, so it could neither authenticate nor apply the Phase 2 migration.
- Decision: `.mcp.json` uses the hosted server with browser OAuth, scoped to `dbtidufiywzghiocijaa`. Writes were enabled only to apply `0001_init` and remove the QA handoff row; `read_only=true` from Phase 2 close.
- Rejected: a personal access token in the shell environment (another long-lived secret); a permanently writable MCP (Claude could change production data outside a migration).
- Evidence: migration `init` applied 2026-10-12; security advisor reports only the intended `rls_enabled_no_policy`.
- Revisit when: a new migration is needed (drop `read_only` for that change only).

## D13: Production keeps the personal OpenRouter key past Phase 2
- Context: D7 planned the Cadre key in Production once the rate limit and spend breaker were verified there. Both are verified (rate limit tripped at request 21; spend breaker fails closed, unit-tested), but the owner chose to keep the personal key for now.
- Decision: the personal key stays in Production; the Cadre key swap moves to final QA.
- Rejected: swapping now (no need while traffic is only testing).
- Evidence: production QA 2026-10-12 17:24–17:25 UTC: 21 turns cost $0.0045 total.
- Revisit when: final QA, before submission.

## D14: Contact details come through a typed form (show_contact_form), submitted as the visitor's own message
- Context: the brief's next-step card (Q2) and the invariant that visitors type their own contact details. Asking for an email in free text works, but invites typos, partial details and model paraphrase.
- Decision: a fourth tool, `show_contact_form`, renders a typed form card (name, work email, company, need, consent). Submission sends a structured visitor message ("Contact details for follow-up: …"), and the model then calls `request_human_followup`. Contact provenance, evals and the single handoff path are unchanged. Tool output shapes live in `src/lib/tools/ui-types.ts`, shared with the UI.
- Rejected: a client-side tool result carrying the details (provenance would have to trust tool output, and evals would need a second path); a separate form endpoint that writes `handoffs` directly (two handoff paths to guard and test).
- Evidence: Tier 1 `contact-form-offered` failed before the tool existed, passes after; `form-submission-handoff` passes with the exact email; 21/21 (prompt 8132cabaf57f).
- Revisit when: Cadre wants intake fields mapped to a CRM (Q3).

## D16: Bot protection is Vercel BotID, not a CAPTCHA
- Context: a public chat that spends model tokens attracts scripted traffic; the IP rate limit and spend breaker cap damage but don't tell a bot from a person.
- Decision: Vercel BotID on `POST /api/chat` (invisible challenge, `checkBotId()` in the route before the rate limit). Bots get the friendly fallback without a model call. Fails open if BotID errors. Attack Mode in the Vercel Firewall stays the manual emergency switch.
- Rejected: CAPTCHA or press-and-hold (friction on every real visitor of a support chat); a full load test (out of proportion for a demo; a burst on Preview proves the guard paths).
- Evidence: `src/lib/guards/bot-check.test.ts` red before the guard existed, green after (63 tests).
- Automation: the headless smoke test (G8 and the 30-minute uptime schedule) sends `x-smoke-token`; a constant-time match with `SMOKE_TOKEN` skips the bot check only, never the rate limit or spend breaker. The 256-bit token was generated straight into Vercel and GitHub and never printed. BotID's docs don't say Vercel's protection-bypass header exempts it, so this doesn't rely on that.
- Revisit when: Deep Analysis is enabled in the Firewall, or bot traffic shows up in turn logs.

## D15: Retention periods and deletion requests
- Context: the bot stores turns, gaps, rate counters and handoffs; path-to-production.md promised retention and a deletion route without either existing.
- Decision: `conversation_turns` 90 days, `knowledge_gaps` 180 days, `rate_counters` 1 day, `handoffs` 12 months. A daily Vercel Cron (`vercel.json`, 04:00 UTC) calls `/api/cron/retention` with `CRON_SECRET` (generated straight into Vercel, never printed). Deletion requests run `npm run delete-contact`. Both live in `src/lib/store/maintenance.ts`, separate from the chat `Store`, so the chat path can never delete.
- Rejected: Supabase `pg_cron` (needs write access through the MCP, which is read-only by D12, and hides the job outside the repo); keeping everything indefinitely.
- Evidence: `src/lib/retention.test.ts` (cutoffs and cron auth) red before the module existed, green after (67 tests).
- Revisit when: Cadre states its own retention policy, or handoffs move to a CRM (then handoffs here can drop to 30 days).

## D17: In-app observability instead of Sentry and Resend
- Context: the demo needs visible tracking of what the backend does (guards, tools, saved handoffs, gaps, cost, errors) and some alerting, without adding third-party accounts to set up, secure and explain.
- Decision: a typed `AppEvent` union (zod, `src/lib/events/types.ts`) validated on write, contact details redacted, stored in `events` (RLS on, 90-day retention) and streamed with each reply as message metadata to a non-modal Behind the scenes panel. Alerting is the 30-minute uptime smoke (GitHub emails on failure). Resend is removed: handoffs are saved rows shown in the panel; no email is sent.
- Rejected: Sentry (another account and SDK for a demo with a handful of routes); Resend (an email nobody reviewing the demo can see; the row is the record).
- Evidence: event schema, redaction and log tests (78 tests); full suite 35/35 with events recorded per scenario.
- Revisit when: a CRM integration lands (route handoff alerts there) or traffic makes in-app review impractical (add Sentry).

## D18: Page links render as cards from a fifth tool, get_page_link
- Context: answers about case studies, services or industries should point to the page, but the bot may never write URLs (link filter, no_url).
- Decision: `get_page_link` takes one of the `links.md` labels (an explicit list, unit-tested against `links.md`) and returns the allowlisted URL plus a one-line description taken from that page's knowledge file. The UI renders it as a page card. Contact and the AI Maturity Index stay with `get_booking_link`, which carries their call to action.
- Rejected: letting the model write links that the UI turns into cards (the link filter would strip them, and the model would choose the URL).
- Evidence: Tier 1 `case-studies-card` and `industry-card` 3/3 each; full suite 35/35.
- Revisit when: Cadre adds pages (update `links.md` and the label list together).
