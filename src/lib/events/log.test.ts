import { describe, expect, it, vi } from "vitest";
import { createEventLog } from "./log";

describe("createEventLog", () => {
  it("keeps events in order and writes each one", async () => {
    const insertEvent = vi.fn(async () => {});
    const log = createEventLog({ insertEvent }, "c1");
    log.emit({ type: "guard_checked", guard: "rate_limit", outcome: "pass" });
    log.emit({ type: "tool_called", tool: "get_page_link" });
    await log.flushed();
    expect(log.events.map((e) => e.type)).toEqual(["guard_checked", "tool_called"]);
    expect(insertEvent).toHaveBeenCalledTimes(2);
  });

  it("survives a failed write", async () => {
    const log = createEventLog({ insertEvent: async () => Promise.reject(new Error("db down")) }, "c1");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    log.emit({ type: "gap_logged", topic: "offices" });
    await expect(log.flushed()).resolves.toBeUndefined();
    expect(log.events).toHaveLength(1);
    spy.mockRestore();
  });

  it("keeps events without a store (input rejected before the store exists)", () => {
    const log = createEventLog(null, "c1");
    log.emit({ type: "guard_checked", guard: "input_cap", outcome: "block" });
    expect(log.events).toHaveLength(1);
  });
});
