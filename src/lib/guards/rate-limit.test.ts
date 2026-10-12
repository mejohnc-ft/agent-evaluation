import { describe, expect, it, vi } from "vitest";
import { VISITOR_MESSAGES } from "./messages";
import { checkRateLimit, RATE_LIMIT, RATE_WINDOW_SECONDS } from "./rate-limit";

const storeReturning = (count: number) => ({ bumpRate: vi.fn(async () => count) });

describe("rate-limit", () => {
  it("uses the documented thresholds", () => {
    expect(RATE_LIMIT).toBe(20);
    expect(RATE_WINDOW_SECONDS).toBe(600);
  });

  it("bumps the counter for the client key in a 600 s window", async () => {
    const store = storeReturning(1);
    await checkRateLimit(store, "203.0.113.7");
    expect(store.bumpRate).toHaveBeenCalledWith("203.0.113.7", 600);
  });

  it("allows the 20th request in the window", async () => {
    expect(await checkRateLimit(storeReturning(20), "ip")).toEqual({ ok: true });
  });

  it("trips on the 21st request", async () => {
    expect(await checkRateLimit(storeReturning(21), "ip")).toEqual({
      ok: false,
      reason: "rate_limited",
      message: VISITOR_MESSAGES.rate_limited,
    });
  });

  it("fails open and logs when the store throws", async () => {
    const log = vi.fn();
    const store = { bumpRate: vi.fn(async () => Promise.reject(new Error("db down"))) };
    expect(await checkRateLimit(store, "ip", log)).toEqual({ ok: true });
    expect(log).toHaveBeenCalledOnce();
  });
});
