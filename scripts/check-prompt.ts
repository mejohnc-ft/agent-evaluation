// G4: the assembled prompt stays under budget and matches the reviewed snapshot.
// `npm run check:prompt -- --update` rewrites the snapshot after a reviewed change.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { buildSystemPrompt } from "../src/lib/prompt/build";

const SNAPSHOT = "src/lib/prompt/prompt.snapshot.md";
const TOKEN_BUDGET = 30_000;

const { text, hash } = buildSystemPrompt();
const tokens = Math.ceil(text.length / 4);

if (process.argv.includes("--update")) {
  writeFileSync(SNAPSHOT, text);
  console.log(`snapshot updated: ${hash}, ~${tokens} tokens`);
  process.exit(0);
}

const errors: string[] = [];
if (tokens > TOKEN_BUDGET) errors.push(`~${tokens} estimated tokens exceeds ${TOKEN_BUDGET}`);
if (!existsSync(SNAPSHOT) || readFileSync(SNAPSHOT, "utf8") !== text) {
  errors.push(`prompt ${hash} differs from ${SNAPSHOT}; review the diff, then run with --update`);
}

if (errors.length) {
  console.error(`check:prompt failed (G4)\n${errors.map((e) => `  - ${e}`).join("\n")}`);
  process.exit(1);
}
console.log(`check:prompt ok: ${hash}, ~${tokens} tokens`);
