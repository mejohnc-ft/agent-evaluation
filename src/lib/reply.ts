import { streamText, type ModelMessage } from "ai";
import { chatModel } from "./llm";
import { buildSystemPrompt } from "./prompt/build";

// The one reply path, shared by the API route and the eval runner. Never fork it.
// The prompt is identical on every turn, so it is marked for provider-side caching.
export function generateReply(messages: ModelMessage[]) {
  return streamText({
    model: chatModel,
    instructions: {
      role: "system",
      content: buildSystemPrompt().text,
      providerOptions: { openrouter: { cacheControl: { type: "ephemeral" } } },
    },
    messages,
  });
}
