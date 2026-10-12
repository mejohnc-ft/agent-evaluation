import { describe, expect, it } from "vitest";
import { checkInput, MAX_MESSAGE_CHARS, MAX_MESSAGES } from "./input-cap";
import { VISITOR_MESSAGES } from "./messages";

const ui = (text: string) => ({ role: "user", parts: [{ type: "text", text }] });

describe("input-cap", () => {
  it("passes a normal conversation", () => {
    expect(checkInput([ui("What does Cadre do?")])).toEqual({ ok: true });
  });

  it("uses the documented thresholds", () => {
    expect(MAX_MESSAGE_CHARS).toBe(2000);
    expect(MAX_MESSAGES).toBe(30);
  });

  it.each([
    ["missing", undefined],
    ["null", null],
    ["a string", "hello"],
    ["an object", { role: "user", content: "hi" }],
    ["empty", []],
    ["a non-object message", ["hi"]],
  ])("rejects messages that are %s", (_, messages) => {
    expect(checkInput(messages)).toEqual({ ok: false, reason: "input_invalid", message: VISITOR_MESSAGES.input_invalid });
  });

  it("accepts a message of exactly 2,000 characters", () => {
    expect(checkInput([ui("a".repeat(2000))])).toEqual({ ok: true });
  });

  it("rejects a UI message over 2,000 characters", () => {
    expect(checkInput([ui("a".repeat(2001))])).toEqual({
      ok: false,
      reason: "input_too_long",
      message: VISITOR_MESSAGES.input_too_long,
    });
  });

  it("rejects a model message with string content over 2,000 characters", () => {
    expect(checkInput([{ role: "user", content: "a".repeat(2001) }])).toMatchObject({ ok: false, reason: "input_too_long" });
  });

  it("counts every text part of one message together", () => {
    const split = { role: "user", parts: [{ type: "text", text: "a".repeat(1500) }, { type: "text", text: "a".repeat(501) }] };
    expect(checkInput([split])).toMatchObject({ ok: false, reason: "input_too_long" });
  });

  it("rejects a long message anywhere in the history, not just the last", () => {
    expect(checkInput([ui("a".repeat(2001)), ui("short")])).toMatchObject({ ok: false, reason: "input_too_long" });
  });

  it("accepts exactly 30 messages and rejects 31", () => {
    expect(checkInput(Array.from({ length: 30 }, () => ui("hi")))).toEqual({ ok: true });
    expect(checkInput(Array.from({ length: 31 }, () => ui("hi")))).toEqual({
      ok: false,
      reason: "too_many_messages",
      message: VISITOR_MESSAGES.too_many_messages,
    });
  });
});
