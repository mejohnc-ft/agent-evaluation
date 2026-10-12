import { describe, expect, it, vi } from "vitest";
import { checkBot } from "./bot-check";
import { VISITOR_MESSAGES } from "./messages";

const verdict = (isBot: boolean) => async () => ({ isBot });

describe("bot-check", () => {
  it("lets a human through", async () => {
    expect(await checkBot(verdict(false))).toEqual({ ok: true });
  });

  it("blocks a bot with the visitor message", async () => {
    expect(await checkBot(verdict(true))).toEqual({
      ok: false,
      reason: "bot_blocked",
      message: VISITOR_MESSAGES.bot_blocked,
    });
  });

  it("fails open and logs when verification itself errors", async () => {
    const log = vi.fn();
    const failing = async () => {
      throw new Error("botid unavailable");
    };
    expect(await checkBot(failing, log)).toEqual({ ok: true });
    expect(log).toHaveBeenCalledOnce();
  });
});
