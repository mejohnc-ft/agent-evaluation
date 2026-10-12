import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import yaml from "js-yaml";
import { modelId } from "../src/lib/llm";
import { buildSystemPrompt, readKnowledge } from "../src/lib/prompt/build";
import { generateReply } from "../src/lib/reply";
import { createMemoryStore } from "../src/lib/store/memory";
import type { ToolContext } from "../src/lib/store/types";
import { check, conversation, type Scenario, type Turn } from "./assertions";

const { values: args } = parseArgs({
  options: { tier: { type: "string" }, id: { type: "string" }, ci: { type: "boolean", default: false } },
});

const scenarios = (yaml.load(readFileSync("evals/scenarios.yaml", "utf8")) as Scenario[]).filter(
  (s) => (!args.tier || s.tier === Number(args.tier)) && (!args.id || s.id === args.id),
);
if (!scenarios.length) throw new Error(`no scenarios match --tier ${args.tier ?? "*"} --id ${args.id ?? "*"}`);

const knowledgeText = readKnowledge().map((k) => k.text).join("\n");
const CONCURRENCY = 4;

// A fresh in-memory store per scenario, so tool writes can be inspected in latest.json.
function toolContext(scenario: Scenario, messages: Turn[]) {
  const store = createMemoryStore();
  const userTexts = messages.filter((m) => m.role === "user").map((m) => m.content);
  return { store, conversationId: `eval-${scenario.id}`, userTexts } satisfies ToolContext;
}

async function runOne(scenario: Scenario) {
  const started = Date.now();
  const messages = conversation(scenario);
  const context = toolContext(scenario, messages);
  const result = generateReply(messages, context);
  let reply = "";
  for await (const chunk of result.textStream) reply += chunk;
  const steps = await result.steps;
  const toolCalls = steps.flatMap((step) => step.toolCalls.map((c) => ({ name: c.toolName, input: c.input })));
  const withText = steps.filter((step) => step.text.trim());
  const stepCounts = { text: withText.length, mixed: withText.filter((step) => step.toolCalls.some((c) => c.toolName === "request_human_followup")).length };
  const failures = check(scenario, reply, toolCalls, stepCounts, knowledgeText);
  const mark = failures.length ? "FAIL" : "pass";
  console.log(`${mark}  ${scenario.id}${failures.map((f) => `\n      - ${f}`).join("")}`);
  const stored = { handoffs: context.store.handoffs, gaps: context.store.gaps };
  return { id: scenario.id, tier: scenario.tier, messages, reply, toolCalls, stored, passed: !failures.length, failures, ms: Date.now() - started };
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
