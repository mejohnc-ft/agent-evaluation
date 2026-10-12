// G7: no eval scenario or assertion is removed without an `Eval-change:` commit trailer.
// Compares evals/scenarios.yaml at the base ref with the working tree. Editing an entry counts as remove + add.
// Base: `--base <ref>`, else EVAL_BASE_REF, else origin/main.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import yaml from "js-yaml";
import type { Scenario } from "../evals/assertions";

const FILE = "evals/scenarios.yaml";
const { values: args } = parseArgs({ options: { base: { type: "string" } } });
const base = args.base ?? process.env.EVAL_BASE_REF ?? "origin/main";

const git = (...argv: string[]) => execFileSync("git", argv, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

function keys(text: string): string[] {
  const out: string[] = [];
  for (const s of (yaml.load(text) ?? []) as Scenario[]) {
    out.push(s.id);
    for (const kind of ["expect", "reject", "reject_claim"] as const) for (const re of s[kind] ?? []) out.push(`${s.id}/${kind}/${re}`);
    for (const name of s.tools?.called ?? []) out.push(`${s.id}/tools.called/${name}`);
    for (const name of s.tools?.not_called ?? []) out.push(`${s.id}/tools.not_called/${name}`);
    for (const [tool, fields] of Object.entries(s.tools?.args ?? {})) {
      for (const [field, re] of Object.entries(fields)) out.push(`${s.id}/tools.args/${tool}.${field}=${re}`);
    }
  }
  return out;
}

git("rev-parse", "--verify", `${base}^{commit}`);
const baseFiles = git("ls-tree", "--name-only", base, FILE).trim();
if (!baseFiles) {
  console.log(`check:evals ok: ${FILE} not present at ${base}, nothing to compare`);
  process.exit(0);
}

const head = keys(readFileSync(FILE, "utf8"));
const headSet = new Set(head);
const removed = keys(git("show", `${base}:${FILE}`)).filter((k) => !headSet.has(k));
const scenarios = head.filter((k) => !k.includes("/")).length;

if (!removed.length) {
  console.log(`check:evals ok: ${scenarios} scenarios, ${head.length - scenarios} assertions, nothing removed`);
  process.exit(0);
}

const list = removed.map((k) => `  - ${k}`).join("\n");
const reasons = git("log", "--format=%B", `${base}..HEAD`).split("\n").filter((l) => /^Eval-change: .+/.test(l));
if (reasons.length) {
  console.log(`check:evals ok: ${removed.length} removed with Eval-change trailer\n${list}\n${reasons.map((r) => `  ${r}`).join("\n")}`);
  process.exit(0);
}
console.error(`check:evals failed (G7)\nremoved since ${base} without an Eval-change: trailer:\n${list}`);
process.exit(1);
