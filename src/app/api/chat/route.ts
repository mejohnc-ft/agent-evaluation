import { convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse, type UIMessage } from "ai";
import { after } from "next/server";
import { checkInput } from "@/lib/guards/input-cap";
import { checkRateLimit } from "@/lib/guards/rate-limit";
import { checkSpend } from "@/lib/guards/spend-breaker";
import { modelId } from "@/lib/llm";
import { buildSystemPrompt } from "@/lib/prompt/build";
import { generateReply } from "@/lib/reply";
import { createSupabaseStore } from "@/lib/store/supabase";
import { logTurn } from "@/lib/turn-log";

const FALLBACK = "Sorry, I couldn't answer just now. Please try again, or email the team at hello@gocadre.ai.";

// A guard trip or setup failure still reads as an assistant message, never a blank chat or a 500.
function say(text: string) {
  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: ({ writer }) => {
        writer.write({ type: "text-start", id: "notice" });
        writer.write({ type: "text-delta", id: "notice", delta: text });
        writer.write({ type: "text-end", id: "notice" });
      },
    }),
  });
}

const textOf = (m: UIMessage) => m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const input = checkInput(body?.messages);
  if (!input.ok) return say(input.message);

  const messages = body.messages as UIMessage[];
  const conversationId = typeof body.id === "string" && /^[\w-]{1,100}$/.test(body.id) ? body.id : crypto.randomUUID();
  const clientKey = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";

  let store;
  try {
    store = createSupabaseStore();
  } catch (error) {
    console.error("store unavailable", error instanceof Error ? error.message : error);
    return say(FALLBACK);
  }

  const rate = await checkRateLimit(store, `ip:${clientKey}`, console.error);
  if (!rate.ok) return say(rate.message);
  const spend = await checkSpend(store, Number(process.env.DAILY_SPEND_LIMIT_USD ?? 1), console.error);
  if (!spend.ok) return say(spend.message);

  const userTexts = messages.filter((m) => m.role === "user").map(textOf);
  const started = Date.now();
  const result = generateReply(await convertToModelMessages(messages), { store, conversationId, userTexts });

  after(async () => {
    try {
      const [replyText, usage, steps] = await Promise.all([result.text, result.usage, result.steps]);
      await logTurn(store, {
        conversationId,
        userText: userTexts.at(-1) ?? "",
        replyText,
        toolCalls: steps.flatMap((s) => s.toolCalls.map((c) => c.toolName)),
        model: modelId,
        promptHash: buildSystemPrompt().hash,
        usage,
        latencyMs: Date.now() - started,
      });
    } catch (error) {
      console.error("turn log failed", error instanceof Error ? error.message : error);
    }
  });

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      console.error("chat stream failed", error);
      return FALLBACK;
    },
  });
}
