import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import { contactFormMessage } from "@/lib/tools/ui-types";
import { lastTypedEmail } from "./message-text";

const msg = (role: UIMessage["role"], text: string, id = text): UIMessage => ({
  id,
  role,
  parts: [{ type: "text", text }],
});

describe("lastTypedEmail", () => {
  it("picks the latest email the visitor typed", () => {
    const messages = [
      msg("user", "I'm at old@example.com"),
      msg("assistant", "Thanks."),
      msg("user", "I'd like someone to contact me jo@example.com."),
    ];
    expect(lastTypedEmail(messages)).toBe("jo@example.com");
  });

  it("ignores assistant messages", () => {
    const messages = [msg("user", "hello"), msg("assistant", "Write to hello@cadre.ai")];
    expect(lastTypedEmail(messages)).toBeUndefined();
  });

  it("ignores contact-form submission chips", () => {
    const chip = contactFormMessage({ name: "Jo", email: "chip@example.com", company: "", need: "Help" });
    const messages = [msg("user", "reach me at jo@example.com"), msg("user", chip)];
    expect(lastTypedEmail(messages)).toBe("jo@example.com");
  });

  it("returns undefined when the visitor typed no email", () => {
    expect(lastTypedEmail([msg("user", "contact me please"), msg("user", "jo at example dot com")])).toBeUndefined();
    expect(lastTypedEmail([])).toBeUndefined();
  });
});

describe("lastTypedEmail before a card", () => {
  it("ignores emails typed after the card's message", () => {
    const messages = [msg("user", "contact me"), msg("assistant", "Here is a form"), msg("user", "later@example.com")];
    expect(lastTypedEmail(messages.slice(0, 1))).toBeUndefined();
  });
});
