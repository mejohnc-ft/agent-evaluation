// D6: how often the judge agrees with human labels on evals/calibration.yaml.
import { readFileSync } from "node:fs";
import yaml from "js-yaml";
import { readKnowledge } from "../src/lib/prompt/build";
import { judge, type Criterion } from "./judge";

type Item = {
  id: string;
  messages: { role: string; content: string }[];
  reply: string;
  toolCalls: string[];
  criteria: Criterion[];
  labels: Record<Criterion, "pass" | "fail">;
};

const { reviewed, items } = yaml.load(readFileSync("evals/calibration.yaml", "utf8")) as { reviewed: boolean; items: Item[] };
const knowledgeText = readKnowledge().map((k) => k.text).join("\n");

async function main() {
  if (!reviewed) console.warn("calibration.yaml is not marked reviewed: labels are Claude's draft, not the owner's.\n");
  let agreed = 0;
  const perCriterion: Record<string, { agree: number; total: number }> = {};
  for (const item of items) {
    const toolCalls = item.toolCalls.map((name) => ({ name, input: {} }));
    const verdicts = await judge({ messages: item.messages, reply: item.reply, toolCalls }, item.criteria, knowledgeText);
    const mismatches = verdicts.filter((v) => (v.pass ? "pass" : "fail") !== item.labels[v.criterion]);
    for (const v of verdicts) {
      const c = (perCriterion[v.criterion] ??= { agree: 0, total: 0 });
      c.total++;
      if (!mismatches.includes(v)) c.agree++;
    }
    if (!mismatches.length) agreed++;
    console.log(`${mismatches.length ? "DISAGREE" : "agree   "}  ${item.id}`);
    for (const m of mismatches) console.log(`      - ${m.criterion}: human ${item.labels[m.criterion]}, judge ${m.pass ? "pass" : "fail"}: ${m.reason}`);
  }
  console.log(`\nAgreement ${agreed}/${items.length} items · ${Object.entries(perCriterion).map(([c, v]) => `${c} ${v.agree}/${v.total}`).join(", ")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
