import { isStepCount, streamText, type ModelMessage } from "ai";
import { stripLinksTransform } from "./guards/link-filter";
import { needsGapFallback } from "./gap-fallback";
import { publishedAmounts, redactPricesTransform } from "./guards/price-guard";
import { chatModel } from "./llm";
import { buildSystemPrompt, readKnowledge } from "./prompt/build";
import { redactContacts } from "./redact";
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
    // Step 1 must call tools (answer_directly when none is needed), so text never comes before the
    // tools it describes. A step that has written text ends the turn: one reply per turn.
    prepareStep: ({ stepNumber }) => (stepNumber === 0 ? { toolChoice: "required" as const } : {}),
    stopWhen: [isStepCount(4), ({ steps }) => steps.at(-1)!.text.trim() !== ""],
    experimental_transform: [
      stripLinksTransform(),
      redactPricesTransform(published(), () => ctx.emit({ type: "guard_checked", guard: "price", outcome: "block" })),
    ],
    // Guarantees the gap is logged even when the model forgot the tool (awaited before the stream ends).
    onEnd: async ({ text, steps }) => {
      if (!needsGapFallback(text, steps.flatMap((s) => s.toolCalls.map((c) => c.toolName)))) return;
      try {
        const question = redactContacts(ctx.userTexts.at(-1) ?? "").slice(0, 500) || "(empty question)";
        await ctx.store.insertGap({ conversationId: ctx.conversationId, question, topic: null });
        ctx.emit({ type: "gap_logged", topic: null });
      } catch (error) {
        ctx.emit({ type: "error", where: "gap_fallback", message: error instanceof Error ? error.message : String(error) });
      }
    },
    onStepEnd: (step) =>
      step.toolCalls
        .filter((call) => call.toolName !== "answer_directly")
        .forEach((call) => ctx.emit({ type: "tool_called", tool: call.toolName })),
  });
}
