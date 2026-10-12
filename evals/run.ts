import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import yaml from "js-yaml";
import { modelId } from "../src/lib/llm";
import { buildSystemPrompt, readKnowledge } from "../src/lib/prompt/build";
import { generateReply } from "../src/lib/reply";
import { createEventLog } from "../src/lib/events/log";
import { createMemoryStore } from "../src/lib/store/memory";
import type { ToolContext } from "../src/lib/store/types";
import { costUsd } from "../src/lib/turn-log";
import { check, conversation, type Scenario } from "./assertions";
import { judge, type Verdict } from "./judge";

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
  const messages = conversation(scenario);
  // A fresh in-memory store per scenario, so tool writes can be inspected in latest.json.
  const store = createMemoryStore();
  const log = createEventLog(store, `eval-${scenario.id}`);
  const context = {
    store,
    conversationId: `eval-${scenario.id}`,
    userTexts: messages.filter((m) => m.role === "user").map((m) => m.content),
    emit: log.emit,
  } satisfies ToolContext;
  const result = generateReply(messages, context);
  let reply = "";
  for await (const chunk of result.textStream) reply += chunk;
  const steps = await result.steps;
  const toolCalls = steps.flatMap((step) => step.toolCalls.map((c) => ({ name: c.toolName, input: c.input })));
  const withText = steps.filter((step) => step.text.trim());
  const stepCounts = { gaps: store.gaps.length, text: withText.length, mixed: withText.filter((step) => step.toolCalls.some((c) => c.toolName === "request_human_followup")).length };
  const failures = check(scenario, reply, toolCalls, stepCounts, knowledgeText);
  const ms = Date.now() - started;
  const cost = costUsd(modelId(), await result.usage, steps);
  let verdicts: Verdict[] = [];
  if (scenario.judge?.length) {
    verdicts = await judge({ messages, reply, toolCalls }, scenario.judge, knowledgeText);
    failures.push(...verdicts.filter((v) => !v.pass).map((v) => `judge.${v.criterion}: ${v.reason}`));
  }
  const mark = failures.length ? "FAIL" : "pass";
  console.log(`${mark}  ${scenario.id}${failures.map((f) => `\n      - ${f}`).join("")}`);
  const stored = { handoffs: store.handoffs, gaps: store.gaps, events: store.events };
  return { id: scenario.id, tier: scenario.tier, messages, reply, toolCalls, stored, verdicts, passed: !failures.length, failures, ms, costUsd: cost };
}

async function main() {
  const results: Awaited<ReturnType<typeof runOne>>[] = [];
  for (let i = 0; i < scenarios.length; i += CONCURRENCY) {
    results.push(...(await Promise.all(scenarios.slice(i, i + CONCURRENCY).map(runOne))));
  }

  const passed = results.filter((r) => r.passed).length;
  const byTier = Object.fromEntries(
    [...new Set(results.map((r) => r.tier))].sort().map((tier) => {
      const inTier = results.filter((r) => r.tier === tier);
      return [`tier${tier}`, `${inTier.filter((r) => r.passed).length}/${inTier.length}`];
    }),
  );
  const sortedMs = results.map((r) => r.ms).sort((a, b) => a - b);
  const totalCost = results.reduce((sum, r) => sum + r.costUsd, 0);
  const report = {
    runAt: new Date().toISOString(),
    modelId: modelId(),
    promptHash: buildSystemPrompt().hash,
    summary: {
      passed,
      failed: results.length - passed,
      total: results.length,
      byTier,
      p50Ms: sortedMs[Math.floor(sortedMs.length / 2)],
      costPerScenarioUsd: totalCost / results.length,
    },
    results,
  };
  mkdirSync("evals/results", { recursive: true });
  const json = JSON.stringify(report, null, 2);
  writeFileSync(`evals/results/${report.runAt.replace(/[:.]/g, "-")}.json`, json);
  writeFileSync("evals/results/latest.json", json);

  const { p50Ms, costPerScenarioUsd } = report.summary;
  console.log(`\n${passed}/${results.length} passed (${Object.entries(byTier).map(([t, v]) => `${t} ${v}`).join(", ")}) · model ${modelId()} · prompt ${report.promptHash}`);
  console.log(`p50 ${p50Ms} ms · $${costPerScenarioUsd.toFixed(5)} per scenario (model only)`);
  if (args.ci && passed < results.length) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
