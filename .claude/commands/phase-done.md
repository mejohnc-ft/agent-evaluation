---
description: Close a plan.md phase with gate evidence
argument-hint: <phase number>
---

Close phase $ARGUMENTS.

1. Run `npm run gate`. If anything fails, stop and report the failures. Do not tick the phase.
2. Run `npm run eval` for the tiers this phase has enabled, and capture the summary line.
3. In `plan.md`, under the phase: tick the status box, fill in the actual time from the git log
   (first and last commit of the phase), and paste the gate and eval summary into Notes.
4. Confirm the phase's "Done looks like" items one by one. For anything that needs the production
   URL, ask me to check it and wait for my answer.
5. Propose the commit `chore(plan): close phase $ARGUMENTS` with a `Verified:` trailer holding the
   summary lines. Show it to me before committing.
