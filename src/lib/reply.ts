import { isStepCount, streamText, type ModelMessage } from "ai";
import { stripLinksTransform } from "./guards/link-filter";
import { publishedAmounts, redactPricesTransform } from "./guards/price-guard";
import { chatModel } from "./llm";
import { buildSystemPrompt, readKnowledge } from "./prompt/build";
import type { ToolContext } from "./store/types";
import { createTools } from "./tools";

// Currency amounts the knowledge base publishes; every other amount is redacted (D3, price guard).
let allowedAmounts: Set<string> | undefined;
const published = () => (allowedAmounts ??= publishedAmounts(readKnowledge().map((k) => k.text).join("\n")));

// The one reply path, shared by the API route and the eval runner. Never fork it.
// The prompt is identical on every turn, so it is marked for provider-side caching.
export function generateReply(messages: ModelMessage[], ctx: ToolContext) {
  return streamText({
    model: chatModel(),
    instructions: {
      role: "system",
      content: buildSystemPrompt().text,
      providerOptions: { openrouter: { cacheControl: { type: "ephemeral" } } },
    },
    messages,
    // Low temperature: the same question should get the same grounded answer (Tier 2 variance).
    temperature: 0,
    tools: createTools(ctx),
    // Continue only after a tool-only step, so the visitor gets one reply that uses the result.
    // A step that already wrote text ends the turn (single_reply in evals/assertions.ts).
    stopWhen: [isStepCount(3), ({ steps }) => steps.at(-1)!.text.trim() !== ""],
    experimental_transform: [
      stripLinksTransform(),
      redactPricesTransform(published(), () => ctx.emit({ type: "guard_checked", guard: "price", outcome: "block" })),
    ],
    onStepEnd: (step) => step.toolCalls.forEach((call) => ctx.emit({ type: "tool_called", tool: call.toolName })),
  });
}
