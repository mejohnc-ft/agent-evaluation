import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import yaml from "js-yaml";
import { modelId } from "../src/lib/llm";
import { buildSystemPrompt, readKnowledge } from "../src/lib/prompt/build";
import { generateReply } from "../src/lib/reply";
import { check, type Scenario } from "./assertions";

const { values: args } = parseArgs({
  options: { tier: { type: "string" }, id: { type: "string" }, ci: { type: "boolean", default: false } },
});

const scenarios = (yaml.load(readFileSync("evals/scenarios.yaml", "utf8")) as Scenario[]).filter(
  (s) => (!args.tier || s.tier === Number(args.tier)) && (!args.id || s.id === args.id),
);
if (!scenarios.length) throw new Error(`no scenarios match --tier ${args.tier ?? "*"} --id ${args.id ?? "*"}`);

const knowledgeText = readKnowledge().map((k) => k.text).join("\n");
const CONCURRENCY = 4;

async function runOne(scenario: Scenario) {
  const started = Date.now();
  const result = generateReply([{ role: "user", content: scenario.input }]);
  let reply = "";
  for await (const chunk of result.textStream) reply += chunk;
  const failures = check(scenario, reply, knowledgeText);
  const mark = failures.length ? "FAIL" : "pass";
  console.log(`${mark}  ${scenario.id}${failures.map((f) => `\n      - ${f}`).join("")}`);
  return { id: scenario.id, tier: scenario.tier, input: scenario.input, reply, passed: !failures.length, failures, ms: Date.now() - started };
}

async function main() {
  const results: Awaited<ReturnType<typeof runOne>>[] = [];
  for (let i = 0; i < scenarios.length; i += CONCURRENCY) {
    results.push(...(await Promise.all(scenarios.slice(i, i + CONCURRENCY).map(runOne))));
  }

  const passed = results.filter((r) => r.passed).length;
  const report = {
    runAt: new Date().toISOString(),
    modelId,
    promptHash: buildSystemPrompt().hash,
    summary: { passed, failed: results.length - passed, total: results.length },
    results,
  };
  mkdirSync("evals/results", { recursive: true });
  const json = JSON.stringify(report, null, 2);
  writeFileSync(`evals/results/${report.runAt.replace(/[:.]/g, "-")}.json`, json);
  writeFileSync("evals/results/latest.json", json);

  console.log(`\n${passed}/${results.length} passed · model ${modelId} · prompt ${report.promptHash}`);
  if (args.ci && passed < results.length) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
