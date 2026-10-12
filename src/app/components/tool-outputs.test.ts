import { describe, expect, it } from "vitest";
import { contactFormMessage } from "@/lib/tools/ui-types";
import { contactSummary } from "./message-text";
import { parseBookingLink, parseContactForm, parseHandoff } from "./tool-outputs";

const link = { purpose: "strategy_call", label: "Contact Cadre", url: "https://cadre.ai/contact", cta: "Talk" };

describe("tool output parsing", () => {
  it("accepts a booking link on an allowed host", () => {
    expect(parseBookingLink(link)).toEqual(link);
    expect(parseBookingLink({ ...link, url: "https://portal.gocadre.ai/assess" })).not.toBeNull();
  });

  it("rejects links off the allowlist or with lookalike hosts", () => {
    for (const url of ["http://cadre.ai/x", "https://cadre.ai.evil.com/", "https://evil.com/?https://cadre.ai/", "javascript:alert(1)"]) {
      expect(parseBookingLink({ ...link, url })).toBeNull();
    }
  });

  it("rejects unknown purposes and missing fields", () => {
    expect(parseBookingLink({ ...link, purpose: "pricing" })).toBeNull();
    expect(parseBookingLink({ url: link.url })).toBeNull();
    expect(parseBookingLink(null)).toBeNull();
  });

  it("only confirms a handoff when ok is literally true", () => {
    expect(parseHandoff({ ok: true, id: "abc" })).toEqual({ ok: true, id: "abc" });
    expect(parseHandoff({ ok: "true", id: "abc" })).toBeNull();
    expect(parseHandoff({ ok: true })).toBeNull();
    expect(parseHandoff({ ok: false, error: "nope" })).toEqual({ ok: false, error: "nope" });
  });

  it("parses the contact form output", () => {
    expect(parseContactForm({ form: "contact", intent: "sales", reason: "Pricing" })).not.toBeNull();
    expect(parseContactForm({ form: "other", intent: "sales", reason: "x" })).toBeNull();
  });
});

describe("contactSummary", () => {
  it("round-trips name and email from contactFormMessage", () => {
    const text = contactFormMessage({ name: "Ada Lovelace", email: "ada@example.com", company: "", need: "Help" });
    expect(contactSummary(text)).toEqual({ name: "Ada Lovelace", email: "ada@example.com" });
  });
});
