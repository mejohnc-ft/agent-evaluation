# Path to production

What it takes for Cadre to run this assistant on cadre.ai and own it without the original engineer.

TODO(you): one-sentence summary of the gap between this demo and production.

## Rollout stages

| Stage | Who sees it | Exit criteria | Duration |
| --- | --- | --- | --- |
| 1. Shadow | Inbound team only, internal URL | 50 reviewed transcripts; zero unsafe answers; team agrees on escalation wording | TODO(you) |
| 2. Contact page | Visitors on cadre.ai/contact | Handoff quality reviewed weekly; gap rate trending down | TODO(you) |
| 3. Site-wide widget | All visitors | Self-serve and handoff targets in client-brief.md met for 2 weeks | Ongoing |

The widget is a small script tag loading the chat in an iframe from this app, so cadre.ai's own stack is untouched.

## Content ownership

- Knowledge lives in `knowledge/*.md` with `source:` and `verified:` frontmatter.
- A non-engineer edits a file in GitHub's web editor and opens a pull request. CI runs G3 and the eval suite; a green check means the change is safe to merge.
- The weekly gap report lists unanswered questions. Each one becomes either a new knowledge entry or a deliberate non-goal.
- TODO(you): name the owner role at Cadre (e.g. marketing ops) and the review cadence.

## Integrations

| Integration | Today | Production | Notes |
| --- | --- | --- | --- |
| Lead handoff | Supabase `handoffs` row (+ email if built) | Salesforce lead or task via API | Map summary, company and intent to fields. TODO(you): field map |
| Booking | Link to cadre.ai/contact | Calendar scheduling link with prefilled context | TODO(you): which scheduler Cadre uses |
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
| Conversations per month | TODO(you): e.g. 1,000 |
| Turns per conversation | 4 |
| Knowledge base tokens (cached) | ~15,000 at $0.01 per million |
| Other input tokens per turn | ~2,000 at $0.10 per million |
| Output tokens per turn | ~400 at $0.50 per million |
| **Estimated monthly model cost** | TODO(you): compute; roughly $2–8 for 1,000 conversations depending on cache hits |

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
- [ ] Access transferred: Vercel, Supabase, OpenRouter, Resend, GitHub, Cloudflare DNS record
- [ ] On-call notes: what to do when the spend breaker trips or evals fail
- [ ] TODO(you)

## What I'd build next

- Week 1: TODO(you): e.g. Salesforce handoff, shadow-mode review tooling.
- Month 1: TODO(you): e.g. MCP server so Cadre's internal agents and a voice channel reuse the same tools.
