---
description: Run evals and diagnose failures
argument-hint: [--tier N] [--id scenario]
---

1. Run `npm run eval -- $ARGUMENTS` and show the summary.
2. If anything failed, use the `eval-reviewer` agent on `evals/results/latest.json`.
3. Report its table, then propose the smallest fix for each failure.
4. Do not edit `evals/scenarios.yaml`, `evals/rubric.md` or `evals/calibration.yaml`. If an
   assertion looks wrong, explain why and wait for my decision.
