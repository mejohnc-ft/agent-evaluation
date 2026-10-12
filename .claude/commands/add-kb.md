---
description: Add or refresh one knowledge file from a cadre.ai page
argument-hint: <url>
---

Add knowledge from $ARGUMENTS.

1. Refuse unless the host is `cadre.ai` or `portal.gocadre.ai`.
2. Use the `kb-researcher` agent on that URL only.
3. Run `npm run check:kb`. Fix only schema issues it reports.
4. If the change affects an answer the bot gives, add or update a scenario in `evals/scenarios.yaml`
   first, then run `npm run eval -- --tier 1`.
5. Show me the diff and the evidence entries. Do not commit; I review and commit.
