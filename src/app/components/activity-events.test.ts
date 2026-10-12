import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import { activityRow, activityTurns, eventsOf, modelName } from "./activity-events";

const base = { conversationId: "c1", at: "2026-10-12T10:00:00.000Z" };
const turn = {
  type: "turn_completed",
  ...base,
  model: "anthropic/claude-haiku-5.5",
  promptHash: "abc",
  inputTokens: 1000,
  outputTokens: 240,
  costUsd: 0.00042,
  latencyMs: 2870,
};

describe("eventsOf", () => {
  it("keeps valid events and drops unknown types or bad shapes", () => {
    const events = eventsOf({
      events: [
        { type: "guard_checked", ...base, guard: "bot", outcome: "pass" },
        { type: "telemetry", ...base },
        { type: "tool_called", ...base },
        "nope",
        turn,
      ],
    });
    expect(events.map((e) => e.type)).toEqual(["guard_checked", "turn_completed"]);
  });

  it("returns nothing for missing or malformed metadata", () => {
    for (const meta of [undefined, null, {}, { events: "x" }, []]) expect(eventsOf(meta)).toEqual([]);
  });
});

describe("activityTurns", () => {
  it("groups by assistant reply, newest first, skipping replies without events", () => {
    const msg = (id: string, role: "user" | "assistant", metadata?: unknown) =>
      ({ id, role, parts: [], metadata }) as UIMessage;
    const turns = activityTurns([
      msg("u1", "user"),
      msg("a1", "assistant", { events: [turn] }),
      msg("a2", "assistant"),
      msg("a3", "assistant", { events: [{ type: "tool_called", ...base, tool: "get_page_link" }] }),
    ]);
    expect(turns.map((t) => [t.id, t.number])).toEqual([["a3", 2], ["a1", 1]]);
  });
});

describe("activityRow", () => {
  it("formats rows in plain language", () => {
    expect(activityRow({ type: "guard_checked", ...base, guard: "rate_limit", outcome: "pass" }).text).toBe(
      "Rate limit · passed",
    );
    expect(activityRow({ type: "handoff_saved", ...base, handoffId: "a1b2c3d4e5f6" }).text).toBe(
      "Saved handoff · a1b2c3d4",
    );
    expect(activityRow({ type: "gap_logged", ...base, topic: null }).text).toBe("Logged knowledge gap");
    expect(activityRow(eventsOf({ events: [turn] })[0]).text).toBe(
      "Reply · Haiku 5.5 · 1,240\u00a0tokens · $0.0004 · 2.9\u00a0s",
    );
  });

  it("marks errors with the error tone", () => {
    const row = activityRow({ type: "error", ...base, where: "handoff", message: "insert failed" });
    expect(row).toEqual({ badge: "error", text: "Error · handoff · insert failed", tone: "error" });
  });

  it("names models", () => {
    expect(modelName("anthropic/claude-sonnet-5.5")).toBe("Sonnet 5.5");
    expect(modelName("openai/gpt-5")).toBe("gpt-5");
  });
});
