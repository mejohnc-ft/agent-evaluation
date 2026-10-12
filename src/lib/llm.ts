import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";

// Env is read on first use, not at import, so `next build` (Preview, CI) needs no secrets.
let loaded: { id: string; model: LanguageModel } | undefined;

function load() {
  if (loaded) return loaded;
  const apiKey = process.env.OPENROUTER_API_KEY;
  const id = process.env.MODEL_ID;
  if (!apiKey || !id) throw new Error("OPENROUTER_API_KEY and MODEL_ID must be set");
  // Usage accounting returns OpenRouter's billed cost per call (providerMetadata.openrouter.usage.cost).
  loaded = { id, model: createOpenRouter({ apiKey }).chat(id, { usage: { include: true } }) };
  return loaded;
}

export const modelId = () => load().id;
export const chatModel = () => load().model;
