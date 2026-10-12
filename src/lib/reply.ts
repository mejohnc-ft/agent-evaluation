import { isStepCount, streamText, type ModelMessage } from "ai";
import { stripLinksTransform } from "./guards/link-filter";
import { chatModel } from "./llm";
import { buildSystemPrompt } from "./prompt/build";
import type { ToolContext } from "./store/types";
import { createTools } from "./tools";

// The one reply path, shared by the API route and the eval runner. Never fork it.
// The prompt is identical on every turn, so it is marked for provider-side caching.
export function generateReply(messages: ModelMessage[], ctx: ToolContext) {
  return streamText({
    model: chatModel,
    instructions: {
      role: "system",
      content: buildSystemPrompt().text,
      providerOptions: { openrouter: { cacheControl: { type: "ephemeral" } } },
    },
    messages,
    tools: createTools(ctx),
    // Continue only after a tool-only step, so the visitor gets one reply that uses the result.
    // A step that already wrote text ends the turn (single_reply in evals/assertions.ts).
    stopWhen: [isStepCount(3), ({ steps }) => steps.at(-1)!.text.trim() !== ""],
    experimental_transform: stripLinksTransform(),
  });
}
