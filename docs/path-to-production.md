# Path to production

What it takes for Cadre to run this assistant on cadre.ai and own it without the original engineer.

The bot, guards, evals and data handling are production-shaped; what's missing is Cadre's answers
to the open questions (client-brief.md), a named content owner, a CRM handoff instead of a
Postgres row, and a staged rollout with real traffic.

## Rollout stages

| Stage | Who sees it | Exit criteria | Duration |
| --- | --- | --- | --- |
| 1. Shadow | Inbound team only, internal URL | 50 reviewed transcripts; zero unsafe answers; team agrees on escalation wording | 2 weeks (assumption) |
| 2. Contact page | Visitors on cadre.ai/contact | Handoff quality reviewed weekly; gap rate trending down | 4 weeks (assumption) |
| 3. Site-wide widget | All visitors | Self-serve and handoff targets in client-brief.md met for 2 weeks | Ongoing |

The widget is a small script tag loading the chat in an iframe from this app, so cadre.ai's own stack is untouched.

## Content ownership

- Knowledge lives in `knowledge/*.md` with `source:` and `verified:` frontmatter.
- A non-engineer edits a file in GitHub's web editor and opens a pull request. CI runs G3 and the eval suite; a green check means the change is safe to merge.
- The weekly gap report lists unanswered questions. Each one becomes either a new knowledge entry or a deliberate non-goal.
- Owner (assumption for Cadre to confirm): marketing ops, the role that already owns cadre.ai content. Weekly: review the gap report and a sample of transcripts and handoffs. Monthly: re-check `verified:` dates against the live pages. Any site change: update the matching knowledge file in the same week.

## Integrations

| Integration | Today | Production | Notes |
| --- | --- | --- | --- |
| Lead handoff | Supabase `handoffs` row, shown in the Behind the scenes panel; no email (D17) | Salesforce lead or task via API | Field map below is a placeholder until Q3 |
| Booking | Link to cadre.ai/contact | Calendar scheduling link with prefilled context | Open: does Cadre use a scheduler at all? None is linked on the site (Q9) |

Placeholder field map for a Salesforce lead (assumption; standard fields, to confirm with Cadre's admin):

| `handoffs` field | Salesforce Lead field | Note |
| --- | --- | --- |
| name | FirstName, LastName | Split on the last space; whole value to LastName if one word |
| email | Email | Typed by the visitor (contact provenance) |
| company | Company | Required on Lead but optional here; send a placeholder when empty |
| summary | Description | The bot's handoff summary |
| intent (sales, client_support, security, other) | Custom picklist | Routes client_support and security away from sales |
| conversation_id | Custom field | Links the lead back to the turn log |
| (constant) | LeadSource = "Website chat" | So the team can filter |
| Client portal | Explain path, hand off | Deep link to portal help, if public | Depends on Q6 in client-brief.md |
| Model access | OpenRouter, one key | OpenRouter with per-environment keys and spend limits; fallback model configured | Fallback keeps the bot up during a provider outage |

## Data and privacy

- Personal details are stored only in `handoffs`; conversation logs keep content without contact details. Verified in production QA (2026-10-12): 21 logged turns, none containing an email; `logTurn` redacts emails before insert.
- Retention (D15): `conversation_turns` 90 days, `knowledge_gaps` 180 days, `rate_counters` 1 day, `handoffs` 12 months (the lead record until a CRM exists). A daily Vercel Cron calls `/api/cron/retention`, which is protected by `CRON_SECRET` and logs counts only.
- Privacy notice: one line under the chat input linking to cadre.ai/legal/privacy-policy.
- Deletion requests: `npm run delete-contact -- --email <address>` (or `--conversation <id>`) removes the person's handoffs and every conversation they were in, across `handoffs`, `knowledge_gaps` and `conversation_turns`. It prints counts only.

## Monitoring and operations

The demo keeps observability in-app (D17): every turn writes typed events to `events`, and the chat's Behind the scenes panel shows the visitor's own events live. A production rollout would point alerts at these tables, or add Sentry once a CRM integration brings third-party services anyway.

| Signal | Source | Alert when |
| --- | --- | --- |
| Uptime | Scheduled smoke test every 30 minutes (GitHub Actions) | Any failed run (GitHub emails the owner) |
| Errors | `events` rows of type `error` (route, model, stream, store, handoff), plus Vercel logs | Any `error` event; over 2% of requests in an hour |
| Guard trips | `events` rows of type `guard_checked` with outcome `block` | Bot or rate-limit blocks spike |
| Daily spend | Logged cost, spend breaker | 80% of daily budget |
| Gap rate | `knowledge_gaps` | Rising week over week |
| Handoff volume | `handoffs` | Drops to zero for a business day (likely broken) |
| Eval pass rate | CI on every content or prompt change | Any Tier 1 failure blocks merge |

## Cost model

Per turn: input tokens × input rate + output tokens × output rate, with the knowledge base billed at the cached rate after the first request.

| Assumption | Value |
| --- | --- |
| Conversations per month | 1,000 (assumption) |
| Turns per conversation | 4 |
| Knowledge base tokens (cached) | ~15,000 at $0.01 per million |
| Other input tokens per turn | ~2,000 at $0.10 per million |
| Output tokens per turn | ~400 at $0.50 per million |
| **Estimated monthly model cost** | **About $2.20 with cache hits, $7.60 without** |

Arithmetic, per turn with the knowledge base cached:

- Knowledge base: 15,000 × $0.01 / 1M = $0.00015
- Other input: 2,000 × $0.10 / 1M = $0.00020
- Output: 400 × $0.50 / 1M = $0.00020
- Turn: $0.00055 · conversation (4 turns): $0.0022 · month (1,000): **$2.20**

With no cache hits the knowledge base bills at $0.10 per million ($0.0015 per turn), so a turn is
$0.0019, a conversation $0.0076 and the month **$7.60**. Both are under the brief's $0.01 per
conversation. The assumptions are conservative: the assembled prompt measured about 6,700 tokens
(`check:prompt`), and production QA logged 21 turns for $0.0045 billed, about $0.0002 per turn.

Replace the estimate with real numbers from `conversation_turns` once the demo has traffic. Verify current rates on OpenRouter before quoting.

## Security review checklist

- [ ] No secrets in the repo or history (gitleaks on full history)
- [ ] Service role key used server-side only; RLS on every table
- [ ] Rate limiting and spend breaker verified under load
- [ ] Output link filter covers markdown links and bare URLs
- [ ] Prompt-injection scenarios pass
- [ ] Dependency audit (`npm audit`) reviewed

## Handover checklist

- [ ] README explains run, deploy, gates and evals
- [ ] Content editing guide for the non-engineer owner
- [ ] Access transferred: Vercel, Supabase, OpenRouter, GitHub, Cloudflare DNS record (Resend was removed, D17)
- [ ] On-call notes: what to do when the spend breaker trips or evals fail
- [ ] Walkthrough: the content owner edits a knowledge file, opens a PR and merges it on a green check, with the engineer watching
- [ ] Secrets rotated after handover: OpenRouter key, `CRON_SECRET`, `SMOKE_TOKEN`, Supabase service role key

## What I'd build next

- Week 1: shadow-mode review tooling (a transcript and handoff view for the inbound team over `conversation_turns`, `handoffs` and `events`), and the Salesforce handoff once Q3 and the field map are confirmed (CRM write-back, parked until rollout).
- Month 1: an MCP server exposing the same five tools, so Cadre's internal agents reuse them (parked until after Level 3); realtime voice only once that exists. Vector retrieval stays parked until the prompt nears 40k tokens; multi-language until the gap report shows demand.
