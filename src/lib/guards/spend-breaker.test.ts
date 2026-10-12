import { describe, expect, it, vi } from "vitest";
import { VISITOR_MESSAGES } from "./messages";
import { checkSpend } from "./spend-breaker";

const storeSpent = (usd: number) => ({ spendTodayUsd: vi.fn(async () => usd) });

describe("spend-breaker", () => {
  it("allows a turn under the daily limit", async () => {
    expect(await checkSpend(storeSpent(4.99), 5)).toEqual({ ok: true });
  });

  it("trips when spend equals the limit", async () => {
    expect(await checkSpend(storeSpent(5), 5)).toEqual({
      ok: false,
      reason: "spend_limit",
      message: VISITOR_MESSAGES.spend_limit,
    });
  });

  it("trips when spend is over the limit", async () => {
    expect(await checkSpend(storeSpent(12.5), 5)).toMatchObject({ ok: false, reason: "spend_limit" });
  });

  it("fails closed and logs when the store throws", async () => {
    const log = vi.fn();
    const store = { spendTodayUsd: vi.fn(async () => Promise.reject(new Error("db down"))) };
    expect(await checkSpend(store, 5, log)).toMatchObject({ ok: false, reason: "spend_limit" });
    expect(log).toHaveBeenCalledOnce();
  });

  it("gives the visitor a way to reach a human", () => {
    expect(VISITOR_MESSAGES.spend_limit).toContain("hello@gocadre.ai");
  });
});
