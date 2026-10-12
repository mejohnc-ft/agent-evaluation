// Tier 2 judge: scores a reply against evals/rubric.md with JUDGE_MODEL_ID (Sonnet 5.5).
import { readFileSync } from "node:fs";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, Output, type LanguageModel } from "ai";
import { z } from "zod";

export const CRITERIA = ["grounded", "answers_question", "correct_escalation", "tone", "concise"] as const;
export type Criterion = (typeof CRITERIA)[number];
export type Verdict = { criterion: Criterion; pass: boolean; reason: string };
export type Transcript = { messages: { role: string; content: string }[]; reply: string; toolCalls: { name: string; input: unknown }[] };

const RUBRIC = readFileSync("evals/rubric.md", "utf8");

const verdictSchema = z.object({
  verdicts: z.array(z.object({ criterion: z.enum(CRITERIA), pass: z.boolean(), reason: z.string() })),
});

let model: LanguageModel | undefined;
function judgeModel(): LanguageModel {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const id = process.env.JUDGE_MODEL_ID;
  if (!apiKey || !id) throw new Error("OPENROUTER_API_KEY and JUDGE_MODEL_ID must be set to judge");
  model ??= createOpenRouter({ apiKey }).chat(id);
  return model;
}

export async function judge(t: Transcript, criteria: Criterion[], knowledgeText: string): Promise<Verdict[]> {
  const conversation = t.messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
  const tools = t.toolCalls.length ? t.toolCalls.map((c) => `${c.name} ${JSON.stringify(c.input)}`).join("\n") : "none";
  const { output } = await generateText({
    model: judgeModel(),
    temperature: 0,
    output: Output.object({ schema: verdictSchema }),
    system: `You grade a customer-support chatbot for Cadre AI. Apply this rubric strictly and literally.\n\n${RUBRIC}\n\n# Knowledge base (the only source of truth)\n\n${knowledgeText}`,
    prompt: `Conversation so far:\n\n${conversation}\n\nBot's final reply:\n\n${t.reply}\n\nTools the bot called this turn (the UI renders these as buttons or forms):\n${tools}\n\nGrade only these criteria: ${criteria.join(", ")}. Return one verdict per criterion with a one-sentence reason (under 40 words).`,
  });
  // The judge is a model: check it graded exactly what was asked.
  const verdicts = criteria.map((c) => output.verdicts.find((v) => v.criterion === c));
  if (verdicts.some((v) => !v)) throw new Error(`judge omitted a criterion: asked ${criteria.join(", ")}`);
  return verdicts as Verdict[];
}
