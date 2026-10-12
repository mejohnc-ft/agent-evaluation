---
description: Simplify code changed in this phase without changing behavior
---

Simplify the code changed on this branch (`git diff main...HEAD`). Behavior must not change.

Apply in order:

1. Inline functions that have exactly one caller and tighten the call site.
   Exceptions, never inline:
   - Guards in `src/lib/guards/` (tested seams for G5 and the mutation check)
   - `generateReply` (shared by the API route and the eval runner)
   - Tool handlers in `src/lib/tools/`
2. Remove defensive checks between our own functions. Assert internal invariants plainly.
   Keep real handling at trust boundaries: user input, model tool arguments (zod),
   OpenRouter and Supabase calls, and the stream. These must end in a typed error or
   the friendly fallback, never a crash or a blank chat.
3. Flatten nesting with guard clauses and inverted conditionals.
4. For functions with several callers, remove unused parameters and options and simplify
   the callers to match. Shared paths must produce identical output for every caller.
5. Run `npm run lint -- --fix` and Prettier. Do not restyle by hand.

Then verify:

- `npm run gate` passes with the same eval results as before the pass.
- Report what changed per file in one line each, and list anything you chose not to
  simplify and why.

Commit as `refactor: simplify phase N` with `Verified:` evidence in the body.
