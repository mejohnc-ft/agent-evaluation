import type { UIMessage } from "ai";
import { CONTACT_FORM_HEADER } from "@/lib/tools/ui-types";

export function messageText(message: UIMessage): string {
  return message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

export function isContactSubmission(message: UIMessage): boolean {
  return message.role === "user" && messageText(message).startsWith(CONTACT_FORM_HEADER);
}

// Pulls the name and email back out of a contactFormMessage() text for the compact chip.
export function contactSummary(text: string): { name: string; email: string } {
  const field = (label: string) =>
    text
      .split("\n")
      .find((line) => line.startsWith(`${label}: `))
      ?.slice(label.length + 2)
      .trim() ?? "";
  return { name: field("Name"), email: field("Email") };
}

// Conservative: local@domain.tld, no quoted locals or IP hosts. A trailing full stop is not matched.
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;

// The most recent email the visitor typed themselves, used to prefill the contact form. Assistant
// text and contact-form submissions are skipped, so the prefill is always the visitor's own words.
export function lastTypedEmail(messages: UIMessage[]): string | undefined {
  for (const message of messages.toReversed()) {
    if (message.role !== "user" || isContactSubmission(message)) continue;
    const found = messageText(message).match(EMAIL);
    if (found) return found.at(-1);
  }
  return undefined;
}
