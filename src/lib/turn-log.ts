import type { LanguageModelUsage } from "ai";
import type { Store, TurnRow } from "./store/types";

// USD per million tokens (OpenRouter, D7). Unknown models are billed at the highest rate so
// the spend breaker errs toward tripping early.
const RATES: Record<string, { input: number; cached: number; output: number }> = {
  "anthropic/claude-haiku-5.5": { input: 0.1, cached: 0.01, output: 0.5 },
  "anthropic/claude-sonnet-5.5": { input: 2, cached: 0.2, output: 10 },
};
const FALLBACK_RATE = RATES["anthropic/claude-sonnet-5.5"];

const EMAIL = /[^\s@<>()]+@[^\s@<>()]+\.[a-z]{2,}/gi;

// Conversation logs keep content without contact details (path-to-production.md).
const redactContacts = (text: string) => text.replace(EMAIL, "[email]");

type Turn = Omit<TurnRow, "inputTokens" | "outputTokens" | "costUsd"> & { usage: LanguageModelUsage };

export async function logTurn(store: Store, { usage, ...turn }: Turn) {
  const rate = RATES[turn.model] ?? FALLBACK_RATE;
  const cached = usage.inputTokenDetails.cacheReadTokens ?? 0;
  const uncached = (usage.inputTokens ?? 0) - cached;
  await store.insertTurn({
    ...turn,
    userText: redactContacts(turn.userText),
    replyText: redactContacts(turn.replyText),
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
    costUsd: (uncached * rate.input + cached * rate.cached + (usage.outputTokens ?? 0) * rate.output) / 1_000_000,
  });
}
