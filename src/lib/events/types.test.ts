import { describe, expect, it } from "vitest";
import { appEvent, appEventSchema } from "./types";

describe("appEvent", () => {
  it("stamps conversation id and time", () => {
    const e = appEvent("c1", { type: "tool_called", tool: "get_booking_link" });
    expect(e).toMatchObject({ type: "tool_called", tool: "get_booking_link", conversationId: "c1" });
    expect(() => new Date(e.at).toISOString()).not.toThrow();
  });

  it("redacts emails in error messages", () => {
    const e = appEvent("c1", { type: "error", where: "handoff", message: "insert failed for jo@acme.co" });
    expect(e).toMatchObject({ message: "insert failed for [email]" });
  });

  it("rejects unknown types and bad fields", () => {
    expect(() => appEventSchema.parse({ type: "nope", conversationId: "c1", at: new Date().toISOString() })).toThrow();
    expect(() => appEvent("c1", { type: "guard_checked", guard: "captcha" as never, outcome: "pass" })).toThrow();
    expect(() => appEvent("", { type: "tool_called", tool: "x" })).toThrow();
  });
});
