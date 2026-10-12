import type { UIMessage } from "ai";
import { z } from "zod";
import { appEventSchema, type AppEvent } from "@/lib/events/types";

// Message metadata arrives over the network: keep only events that match the contract and skip
// anything else (unknown types, bad shapes) rather than failing the whole turn.
const metadataShape = z.object({ events: z.array(z.unknown()) });

export function eventsOf(metadata: unknown): AppEvent[] {
  const parsed = metadataShape.safeParse(metadata);
  if (!parsed.success) return [];
  return parsed.data.events.flatMap((raw) => {
    const event = appEventSchema.safeParse(raw);
    return event.success ? [event.data] : [];
  });
}

export type Turn = { id: string; number: number; events: AppEvent[] };

// One group per assistant reply that carried events, newest reply first.
export function activityTurns(messages: UIMessage[]): Turn[] {
  const turns: Turn[] = [];
  for (const message of messages) {
    if (message.role !== "assistant") continue;
    const events = eventsOf(message.metadata);
    if (events.length > 0) turns.push({ id: message.id, number: turns.length + 1, events });
  }
  return turns.reverse();
}

export type ActivityRow = { badge: string; text: string; tone: "default" | "error" };

const GUARD: Record<Extract<AppEvent, { type: "guard_checked" }>["guard"], string> = {
  input_cap: "Input size",
  bot: "Bot check",
  rate_limit: "Rate limit",
  spend: "Spend limit",
};
const OUTCOME = { pass: "passed", block: "blocked", skipped: "skipped" } as const;

// "anthropic/claude-haiku-5.5" → "Haiku 5.5"; other ids lose only their provider prefix.
export function modelName(id: string): string {
  const name = id.slice(id.lastIndexOf("/") + 1);
  const claude = /^claude-([a-z]+)-([\d.]+)$/i.exec(name);
  if (!claude) return name;
  return `${claude[1][0].toUpperCase()}${claude[1].slice(1)} ${claude[2]}`;
}

export function activityRow(event: AppEvent): ActivityRow {
  const row = (text: string, tone: ActivityRow["tone"] = "default") => ({ badge: event.type, text, tone });
  switch (event.type) {
    case "guard_checked":
      return row(`${GUARD[event.guard]} · ${OUTCOME[event.outcome]}`);
    case "tool_called":
      return row(`Tool · ${event.tool}`);
    case "handoff_saved":
      return row(`Saved handoff · ${event.handoffId.slice(0, 8)}`);
    case "gap_logged":
      return row(event.topic ? `Logged knowledge gap · ${event.topic}` : "Logged knowledge gap");
    case "turn_completed": {
      const tokens = (event.inputTokens + event.outputTokens).toLocaleString("en-US");
      const seconds = (event.latencyMs / 1000).toFixed(1);
      // No-break spaces keep each number with its unit when the row wraps.
      return row(`Reply · ${modelName(event.model)} · ${tokens}\u00a0tokens · $${event.costUsd.toFixed(4)} · ${seconds}\u00a0s`);
    }
    case "error":
      return row(`Error · ${event.where} · ${event.message}`, "error");
  }
}
