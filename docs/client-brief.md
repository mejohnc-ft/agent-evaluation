# Client brief: Cadre AI support assistant

owner: John Christensen · status: draft · last-review: 2026-10-12

## Problem

Cadre's inbound team is answering a growing volume of repetitive questions from prospects,
existing clients and curious visitors. Senior strategists spend time on questions a website
could answer, while high-value conversations wait.

The assistant answers common questions from Cadre's published content, qualifies intent, and
hands real opportunities and account issues to a human with context attached.

If it works, the inbound team stops answering questions the site already answers and starts each
conversation from a handoff that says who the visitor is and what they need. (Assumption for
Cadre to confirm.)

## Users and intents

| User | Top intents | Value to Cadre | Bot's job | Hands off when |
| --- | --- | --- | --- | --- |
| Prospect (PE-backed or services firm leader) | What Cadre does; industry fit; pricing; case studies; book a call | Highest: pipeline | Answer, establish fit, route to a strategist | Pricing, scoping, or any buying signal |
| Existing client | Portal access; tracking tools, agents and results; support | Retention | Explain the access path | Login, billing or account-specific issues, always |
| Business leader exploring | AI Maturity Index; LLM selection; data security | Future pipeline | Educate, link to the Maturity Index | Security or compliance specifics not published |
| Other (careers, press, vendors, partners) | Jobs, interviews, partnerships | Low | Redirect to the right page | Immediately |

Assumed volume, highest first: prospects, business leaders exploring, existing clients, other.
This is a guess from the site's structure (most pages sell services or the Maturity Index), not
data. Cadre's real inbound mix replaces it.

## Success metrics

Definitions are measurable from `conversation_turns`, `handoffs` and `knowledge_gaps`.

| Metric | Definition | Target | Measured by |
| --- | --- | --- | --- |
| Self-serve resolution | Conversations ending without a handoff or gap log | 60% (assumption; revisit after two weeks of traffic) | Logging query |
| Qualified handoffs | Handoffs with name, email, company and a usable summary | Weekly number to set after two weeks of traffic; meanwhile every handoff has all four | `handoffs` |
| Answer correctness | Tier 2 judge pass rate on the eval suite | 90% or better | `npm run eval` |
| Unsafe answers | Invented prices, URLs, or human impersonation | 0 | Tier 1 assertions, runtime link filter |
| Knowledge coverage | Gap entries per 100 conversations, trending down | Baseline from the first two weeks, then lower each month (assumption) | `knowledge_gaps` |
| Cost | Dollars per conversation | Under $0.01 | Logged OpenRouter cost |

## Non-goals (this build)

- Quoting prices, scoping engagements, or making commitments on Cadre's behalf.
- Producing an AI Maturity Index score. The assessment is Cadre's proprietary product.
- Troubleshooting client accounts or portal logins.
- Authentication, chat history across sessions, multi-language support.
- Writing to a CRM. Handoffs land in Postgres; the CRM path is in path-to-production.md.

## Assumptions and open questions

Each assumption is encoded somewhere specific, so a different answer from Cadre is a known, small change.

| # | Question for Cadre | Assumption made | Impact if wrong | Encoded in |
| --- | --- | --- | --- | --- |
| Q1 | Who receives handoffs, and how fast do they respond? | Inbound team inbox, next business day | Bot over-promises response time | `system.md` escalation script |
| Q2 | May the bot collect name, email and company in chat? | Yes, with stated purpose and visitor confirmation | Privacy exposure | `request_human_followup`, next-step card |
| Q3 | Which CRM should leads land in? | Salesforce (a listed partner), not built yet | Integration rework | path-to-production.md |
| Q4 | Can the bot discuss pricing at all? | No; always route to a call | Lost qualification signal | `system.md`, Tier 1 no-currency assertion |
| Q5 | Is there a public data-security statement? | No: only four marketing bullets on /strategy and /ai-engineering; /security is 404 (D4) | Invented or missing claims | `knowledge/security.md` |
| Q6 | Is the client portal login URL public? | No: only portal.gocadre.ai/ai-maturity-index is linked; clients go to a human (hello@gocadre.ai) | Bot can't route clients | `knowledge/links.md` |
| Q7 | What brand voice should it use? | Direct, plain, no hype, matching cadre.ai | Off-brand tone | `system.md`, Tier 2 tone criterion |
| Q8 | Canonical domain? | cadre.ai (brief says cadreai.com; live site is cadre.ai) | Broken links | `knowledge/links.md`, G3 |
| Q9 | Is "Talk to an AI Strategist" (the /contact form) the right booking route, or is there a scheduler? | /contact form; no calendar link exists on the site | Bot sends visitors to a form when Cadre expects a calendar | `get_booking_link`, `links.md` |

Send first: Q1 and Q4. Q1 sets the promise the bot makes on every handoff, and Q4 decides whether
the most common prospect question gets any answer beyond a call. The others have safe defaults
that are small changes if wrong. (Assumption: the recruiter can relay both.)

## Risks

| Risk | Likelihood | Impact | Mitigation | Gate |
| --- | --- | --- | --- | --- |
| Bot invents prices, clients or results | Medium | High: legal and brand | Answer only from knowledge; no-currency assertion; judge groundedness | G6 |
| Bot emits a fake or wrong URL | Medium | Medium | Allowlist plus runtime link filter | G3, G5, G6 |
| Prompt injection exposes instructions or changes behavior | Medium | Medium | Instructions treat user text as data; canary assertion | G6 Tier 3 |
| Public URL drains the $5 key | Medium | High: demo outage | Rate limit; daily spend breaker; separate dev key | G5 |
| Secrets leak into the repo or zip | Low | High | gitleaks pre-commit; env-edit hook; zip check | G1, G10 |
| Visitor shares sensitive personal data | Low | Medium | Store details only in `handoffs`; retention policy | Tier 3 scenario |
| Content goes stale as cadre.ai changes | High over time | Medium | `verified:` dates; gap report; evals on content changes | G3, G6 |

## Why this is a reusable pattern

Cadre builds agents for its clients. The pieces here are client-agnostic: a sourced knowledge
folder, an allowlist, tools defined once, deterministic guardrails, a tiered eval suite, and
gates that keep them honest. Cadre could reuse them for any client's support assistant.
Swapping the knowledge folder, links and tool backends is the per-client work.

Packaging (assumption): both. A template repo with the code, gates and eval harness and an empty
`knowledge/` and `links.md`, plus a short playbook for the per-client work: pre-read the client's
site for traps, draft and review the knowledge base, write Tier 1 scenarios first, calibrate the
judge, then roll out in the three stages in path-to-production.md.
