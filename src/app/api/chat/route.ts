import { convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse, type UIMessage } from "ai";
import { after } from "next/server";
import { checkBotId } from "botid/server";
import { createEventLog, type EventLog } from "@/lib/events/log";
import type { MessageMetadata } from "@/lib/events/types";
import { checkBot } from "@/lib/guards/bot-check";
import { checkInput } from "@/lib/guards/input-cap";
import type { GuardResult } from "@/lib/guards/messages";
import { checkRateLimit } from "@/lib/guards/rate-limit";
import { checkSpend } from "@/lib/guards/spend-breaker";
import { modelId } from "@/lib/llm";
import { buildSystemPrompt } from "@/lib/prompt/build";
import { generateReply } from "@/lib/reply";
import { matchesSecret } from "@/lib/secrets";
import { createMemoryStore } from "@/lib/store/memory";
import { createSupabaseStore } from "@/lib/store/supabase";
import type { Store } from "@/lib/store/types";
import { costUsd, logTurn } from "@/lib/turn-log";

// Local development without Supabase credentials keeps everything in memory (never in production).
const devStore =
  process.env.NODE_ENV === "development" && !process.env.SUPABASE_SERVICE_ROLE_KEY ? createMemoryStore() : undefined;
if (devStore) console.warn("SUPABASE_SERVICE_ROLE_KEY not set: using the in-memory store for local development");

const FALLBACK = "Sorry, I couldn't answer just now. Please try again, or email the team at hello@gocadre.ai.";

// A guard trip or setup failure still reads as an assistant message (never a blank chat or a 500),
// and carries the turn's events so the Behind the scenes panel can show why.
function say(text: string, log: EventLog) {
  const metadata: MessageMetadata = { events: log.events };
  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: ({ writer }) => {
        writer.write({ type: "start", messageMetadata: metadata });
        writer.write({ type: "text-start", id: "notice" });
        writer.write({ type: "text-delta", id: "notice", delta: text });
        writer.write({ type: "text-end", id: "notice" });
        writer.write({ type: "finish", messageMetadata: metadata });
      },
    }),
  });
}

type Guard = "input_cap" | "bot" | "rate_limit" | "spend";

function record(log: EventLog, guard: Guard, result: GuardResult) {
  log.emit({ type: "guard_checked", guard, outcome: result.ok ? "pass" : "block" });
  return result.ok;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const conversationId = typeof body?.id === "string" && /^[\w-]{1,100}$/.test(body.id) ? body.id : crypto.randomUUID();

  // Input is checked before the store exists, so this first event is streamed but not persisted.
  const precheck = createEventLog(null, conversationId);
  const input = checkInput(body?.messages);
  if (!input.ok) {
    record(precheck, "input_cap", input);
    return say(input.message, precheck);
  }

  let store: Store;
  try {
    store = devStore ?? createSupabaseStore();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("store unavailable", message);
    precheck.emit({ type: "error", where: "store", message });
    return say(FALLBACK, precheck);
  }
  const log = createEventLog(store, conversationId);
  record(log, "input_cap", input);
  after(() => log.flushed());

  const messages = body.messages as UIMessage[];
  const clientKey = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";

  // The scheduled smoke test runs headless; its secret token skips only the bot check (D16).
  if (matchesSecret(req.headers.get("x-smoke-token"), process.env.SMOKE_TOKEN)) {
    log.emit({ type: "guard_checked", guard: "bot", outcome: "skipped" });
  } else {
    const bot = await checkBot(checkBotId, console.error);
    if (!record(log, "bot", bot)) return say(bot.ok ? FALLBACK : bot.message, log);
  }
  const rate = await checkRateLimit(store, `ip:${clientKey}`, console.error);
  if (!record(log, "rate_limit", rate)) return say(rate.ok ? FALLBACK : rate.message, log);
  const spend = await checkSpend(store, Number(process.env.DAILY_SPEND_LIMIT_USD ?? 1), console.error);
  if (!record(log, "spend", spend)) return say(spend.ok ? FALLBACK : spend.message, log);

  const userTexts = messages
    .filter((m) => m.role === "user")
    .map((m) => m.parts.map((p) => (p.type === "text" ? p.text : "")).join(""));
  const started = Date.now();
  let result: ReturnType<typeof generateReply>;
  try {
    result = generateReply(await convertToModelMessages(messages), { store, conversationId, userTexts, emit: log.emit });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("model unavailable", message);
    log.emit({ type: "error", where: "model", message });
    return say(FALLBACK, log);
  }

  after(async () => {
    try {
      const [replyText, usage, steps] = await Promise.all([result.text, result.usage, result.steps]);
      await logTurn(store, {
        conversationId,
        userText: userTexts.at(-1) ?? "",
        replyText,
        toolCalls: steps.flatMap((s) => s.toolCalls.map((c) => c.toolName)),
        model: modelId(),
        promptHash: buildSystemPrompt().hash,
        usage,
        steps,
        latencyMs: Date.now() - started,
      });
    } catch (error) {
      console.error("turn log failed", error instanceof Error ? error.message : error);
    }
  });

  return result.toUIMessageStreamResponse({
    // At the end of the reply the panel gets this turn's events. Cost here is the rate-table
    // estimate; conversation_turns keeps OpenRouter's billed cost.
    messageMetadata: ({ part }): MessageMetadata | undefined => {
      if (part.type !== "finish") return undefined;
      log.emit({
        type: "turn_completed",
        model: modelId(),
        promptHash: buildSystemPrompt().hash,
        inputTokens: part.totalUsage.inputTokens ?? 0,
        outputTokens: part.totalUsage.outputTokens ?? 0,
        costUsd: costUsd(modelId(), part.totalUsage, []),
        latencyMs: Date.now() - started,
      });
      return { events: log.events };
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error("chat stream failed", message);
      log.emit({ type: "error", where: "stream", message });
      return FALLBACK;
    },
  });
}
