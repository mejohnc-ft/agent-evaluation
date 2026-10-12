# Plan: Cadre AI support assistant

Brief: `docs/client-brief.md` · Decisions: `docs/decisions.md` · Production path: `docs/path-to-production.md`

## Goal

A support assistant on a public URL that answers Cadre AI's prospects, existing clients and curious visitors from sourced cadre.ai content, and hands pricing, account issues and anything it can't answer to a human with context attached.
The outcome that matters to Cadre: strategists spend their time on qualified conversations, and the bot never states something Cadre hasn't published.

## Stop rules

- No work on the next phase until the current exit gate is green in production.
- New ideas go in the Parking lot, not into code.
- A task 50% over its time box gets cut to its smallest version or parked; log it under Scope changes.
- 6:30: feature freeze.
- After 15 minutes on one bug: write the error and a hypothesis, `/clear`, re-brief.

## Gates

Each gate is a mechanical check, proven once by making it fail. Commits that add or rely on one carry a `Gate:` trailer.

| Gate | Checks | Where it runs | Proven by | Phase |
| --- | --- | --- | --- | --- |
| G1 | No secrets staged: `gitleaks protect --staged` | husky pre-commit | A staged fake `sk-or-v1-` key is refused | 0 |
| G2 | Claude cannot read or edit `.env*` (except `.env.example`) | `.claude/settings.json` PreToolUse hook, `scripts/hooks/block-env-edits.mjs` | Asking Claude to edit `.env.local` is blocked | 0 |
| G3 | Knowledge schema: `source:`/`verified:` frontmatter, source host allowed, every `links.md` entry https on an allowed host | `npm run check:kb`, pre-commit and CI | Removing a `source:` line refuses the commit | 1 |
| G4 | Prompt under 30k estimated tokens and matches `prompt.snapshot.md` | `npm run check:prompt`, CI | An unreviewed prompt change fails | 1 |
| G5 | Guard unit tests written from `docs/guards.md` failure modes | Vitest, CI | Tests fail before the guard exists | 2 |
| G6 | Eval suite: Tier 1 deterministic assertions; Tier 2 judge | `npm run eval -- --tier 1 --ci` in CI | Tier 1 failure blocks merge | 1–3 |
| G7 | No scenario or assertion removed without an `Eval-change:` trailer | `scripts/check-eval-integrity.ts`, CI | Deleting an assertion fails CI | 3 |
| G8 | Production smoke test against the deployed URL | Playwright, GitHub Action on `deployment_status` | Smoke runs green after each deploy | 1 |
| G9 | Edited files lint clean; typecheck passes before Claude stops | `.claude/settings.json` PostToolUse and Stop hooks | A type error makes Claude fix it before stopping | 0 |
| G10 | Submission zip: `git log` works, gitleaks clean on files and history, a few MB, CLAUDE.md and plan.md at root | Manual script at wrap | All five checks pass on the extracted zip | Wrap |

## Checkpoints and cut order

| Checkpoint | Must be true |
| --- | --- |
| A, 0:45 | Docs and gates committed; production skeleton streams |
| B, 2:30 | Exit gate 1: Tier 1 12/12, smoke green in production |
| C, 4:30 | Handoff row created from production; CI green on the merged PR |
| D, 5:30 | Exit gate 2: about 28 scenarios, judge calibrated, model chosen |
| E, 6:30 | Feature freeze |

Missing a checkpoint by 20 minutes or more: cut from the top until back on time, and log each cut under Scope changes.

1. Next-step card
2. `/evals` page (an eval table in the README replaces it)
3. Second-session UI track
4. Tier 3 reduced to 4 scenarios
5. Model comparison on Tier 1 only
6. Turn logging
7. Judge calibration reduced to 5 transcripts

Never cut: G1, G3, the Tier 1 eval gate, G8, the handoff row, honest escalation, current CLAUDE.md and plan.md.

## Phase 0: Foundation (0:00–0:45)

- **I need:** docs and gates in place before app code; a skeleton live in production.
- **You get:** CLAUDE.md, plan.md, `.claude/` agents and commands; G1, G2, G9; streaming chat skeleton.
- **Done looks like:** each gate proven once (blocked env edit, refused fake-key commit, type error fixed by Stop hook); production URL streams a reply.
- **Setup notes:** the repo already exists (`mejohnc-ft/agent-evaluation`, docs in place), so commit 1 is the docs; scaffold Next.js into a temp dir and copy it in as commit 2; push to the existing `origin` (no `gh repo create`). Set Node 22 in Vercel project settings (it defaults to 24). Vercel Production gets the personal OpenRouter key, not the Cadre key (D7). Next 16.4 enables `cacheComponents`: render the `useChat` client component inside `<Suspense>` or the build fails.
- [ ] Status · Actual time: · Notes:

## Phase 1: Knowledge, prompt, Tier 1 evals (0:45–2:30)

- **I need:** correct, sourced answers to the six brief scenarios.
- **You get:** `knowledge/*.md`, `links.md`, `system.md`, prompt builder, eval runner, 12 Tier 1 scenarios; G3, G4, G8.
- **Done looks like:** Tier 1 12/12; smoke test green on production; tag `level-1`.
- [ ] Status · Actual time: · Notes:

## Phase 2: Tools, handoff, guardrails, CI (2:30–4:30)

- **I need:** a visitor can reach a human with context; abuse can't break the bot or drain the key.
- **You get:** three tools, Supabase tables, runtime guardrails, turn logging, CI; G5.
- **Done looks like:** production handoff creates a row; gap logged on an unknown question; rate limit trips; CI green on the merged PR; Vercel Production switched to the Cadre key after the rate limit and spend breaker are verified there (D7).
- [ ] Status · Actual time: · Notes:

## Phase 3: Eval depth and model choice (4:30–5:30)

- **I need:** evidence the bot is correct beyond keyword checks, and a model chosen on data.
- **You get:** rubric, calibrated judge, Tier 2 and 3 scenarios (~28 total), model comparison; G7.
- **Done looks like:** judge agreement recorded; Tier 1 100%, Tier 2 90%+; decision logged; tag `level-2`.
- [ ] Status · Actual time: · Notes:

## Phase 4: Level 3 item (5:30–6:30)

- **I need:** reviewers can see verification without reading code.
- **You get:** public `/evals` page; next-step card only if ahead.
- **Done looks like:** `/evals` live and linked from chat; tag `freeze`.
- [ ] Status · Actual time: · Notes:

## Wrap (6:30–7:30)

- **I need:** a submission that tells the story and passes its own checks.
- **You get:** README, prompts log, known issues, verified zip.
- **Done looks like:** G10 zip check passes; demo rehearsed; submitted a business day early.
- [ ] Status · Actual time: · Notes:

## Scope changes

| Time | Change | Reason |
| --- | --- | --- |
| | | |

## Parking lot

| Idea | Why parked | Revisit when |
| --- | --- | --- |
| Vector retrieval | Knowledge base fits in context | Prompt passes ~40k tokens |
| MCP server | Tools already defined once; small next step | After Level 3 page ships |
| Realtime voice | No grading weight; high demo risk | MCP server exists |
| CRM write-back | Needs Cadre's field map (Q3) | Production rollout |
| Auth and chat history | Not needed for anonymous inbound | Client portal integration |
| Multi-language | No evidence of non-English inbound | Gap report shows demand |
