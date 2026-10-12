import { block, pass, type GuardResult } from "./messages";

export const MAX_MESSAGE_CHARS = 2000;
export const MAX_MESSAGES = 30;

type Part = { type?: unknown; text?: unknown };

// Text of a UI message (parts) or a model message (string or part array content).
function messageText(message: { content?: unknown; parts?: unknown }): string {
  if (typeof message.content === "string") return message.content;
  const parts = Array.isArray(message.parts) ? message.parts : Array.isArray(message.content) ? message.content : [];
  return (parts as Part[]).map((p) => (p && typeof p.text === "string" ? p.text : "")).join("");
}

// Trust boundary: `messages` is the raw request body field.
export function checkInput(messages: unknown): GuardResult {
  if (!Array.isArray(messages) || messages.length === 0) return block("input_invalid");
  if (messages.some((m) => typeof m !== "object" || m === null)) return block("input_invalid");
  if (messages.length > MAX_MESSAGES) return block("too_many_messages");
  if (messages.some((m) => messageText(m).length > MAX_MESSAGE_CHARS)) return block("input_too_long");
  return pass;
}
