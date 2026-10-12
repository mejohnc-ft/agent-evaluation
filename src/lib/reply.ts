import { streamText, type ModelMessage } from "ai";
import { chatModel } from "./llm";

// Placeholder until Phase 1 replaces it with src/lib/prompt/ (system.md + knowledge).
const SYSTEM_PROMPT =
  "You are the Cadre AI support assistant. You are an AI, not a human. Keep replies under 120 words.";

// The one reply path, shared by the API route and the eval runner. Never fork it.
export function generateReply(messages: ModelMessage[]) {
  return streamText({ model: chatModel, system: SYSTEM_PROMPT, messages });
}
