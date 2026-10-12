# Guards

Server-side checks that run around `generateReply`. Each guard is one file in `src/lib/guards/`,
returns a typed result and never throws to the visitor. Visitor-facing text lives in
`src/lib/guards/messages.ts`. Every failure mode below has a unit test in
`src/lib/guards/*.test.ts` (gate G5); the tests were written before the guards and failed first.

Result shape: `{ ok: true } | { ok: false; reason; message }`. The route turns a failure into the
friendly `message`, never a blank chat or a stack trace.

Order in the route: input cap, rate limit, spend breaker, then the model call with the link filter
on the stream. Contact provenance runs inside the tools that accept an email.

## input-cap

Stops oversized or malformed requests before they cost tokens: a pasted document, a scripted
conversation stuffed with fake turns, or a body that is not a chat at all.

| Failure mode | Threshold | Reason | Visitor sees |
| --- | --- | --- | --- |
| `messages` missing, not an array, or empty | n/a | `input_invalid` | "couldn't read that message" |
| A message is not an object | n/a | `input_invalid` | same |
| Any one message's text is too long | > 2,000 characters (2,000 passes) | `input_too_long` | "message too long, please shorten it" |
| Too many messages in the conversation | > 30 messages (30 passes) | `too_many_messages` | "conversation is long, start a new one" |

Message text is the string `content`, or the joined `text` of its parts (UI or model message
shape). No store access, so no store-error mode.

## rate-limit

Stops one client from flooding the bot (cost abuse, scripted scraping, a stuck retry loop).

- Key: the client key the route derives (the IP). Each request calls `store.bumpRate(key, 600)`.
- Threshold: 20 requests per fixed 600-second window. The 20th request passes; the 21st trips.
- Reason `rate_limited`. Visitor sees "you're sending messages quickly, please wait a few minutes".
- Store error: **fail open**. The request is allowed and the error is logged. A Supabase outage
  must not take the bot down for everyone; the spend breaker still caps the worst case.

## spend-breaker

Stops runaway model spend from any cause (abuse that slips past the rate limit, a loop, a pricing
change) by refusing new turns once today's spend reaches the daily limit.

- Limit: `DAILY_SPEND_LIMIT_USD`, parsed by the route and passed in as a number.
- Threshold: trips when `store.spendTodayUsd() >= limit` (UTC day). Just under the limit passes.
- Reason `spend_limit`. Visitor sees "I can't answer right now" plus the published support email.
- Store error: **fail closed**. The request is refused and the error is logged. If we cannot see
  today's spend we cannot prove we are under the limit, and an unbounded bill on the OpenRouter key
  is worse than a short outage of the bot.

## link-filter

Enforces "the model never writes URLs in text". Links reach the visitor only from tool results,
rendered by the UI against the allowlist. Anything URL-shaped in model text is removed.

| Model writes | Becomes |
| --- | --- |
| `https://cadre.ai/book` or `http://...` | removed (trailing `.`, `,`, `)` etc. kept) |
| `www.example.com/path` | removed |
| bare domain `cadre.ai/x`, `portal.gocadre.ai` | removed |
| markdown `[book a call](https://cadre.ai/book)` | `book a call` |
| markdown image `![logo](https://...)` | `logo` |
| email `hello@gocadre.ai` | unchanged (emails are not links) |

Bare domains are matched on the same TLDs the eval `no_url` check uses (plus `.dev`, `.app`).

Streaming: the model's text arrives as deltas and a URL can be split across them
(`"see https://ca"` + `"dre.ai/x now"`). The stream transform buffers text until a whitespace
boundary, holds back an unclosed markdown `[...](...)`, filters what is complete, and flushes the
rest on `text-end` or at stream end. Output equals `stripLinks` of the whole text. Only
`text-delta` parts change; every other part (tool calls, tool results, reasoning, finish) passes
through untouched. A run of over 4,000 characters without whitespace is flushed through the filter
rather than held forever. No store access.

## contact-provenance

Enforces "the model never attributes contact details". A tool argument email is accepted only if
the visitor typed that exact address in one of their own messages (`ToolContext.userTexts`).

| Failure mode | Result |
| --- | --- |
| Model invents an email the visitor never typed | rejected, `contact_unverified` |
| Model "corrects" or completes a typed email (`jo@acme.co` typed, `jo@acme.com` sent) | rejected |
| Email appears only in assistant text or a tool result, not a visitor message | rejected |
| Empty or blank email | rejected |
| Same address, different case or surrounding spaces | accepted (case-insensitive, trimmed) |

Matching compares whole addresses found in the visitor's text, not substrings, so a prefix of a
typed address does not pass. The rejection message is for the model (via the tool result): ask the
visitor to type their email in the chat. The UI never confirms a handoff unless the row is written.
No store access.

## bot-check

Vercel BotID classifies each `/api/chat` request invisibly: the browser runs a challenge set up by
`src/instrumentation-client.ts`, and the route calls `checkBotId()` before the rate limit. No CAPTCHA
or press-and-hold, so real visitors see nothing.

| Failure mode | Behaviour |
| --- | --- |
| Scripted client (curl, headless scraper) without a valid challenge token | blocked, `bot_blocked`, no model call |
| Real browser | passes |
| BotID verification throws | fails open and logs; the rate limit and spend breaker still apply |

Visitor sees: "I couldn't verify this browser. Please reload the page and try again, or email hello@gocadre.ai."
