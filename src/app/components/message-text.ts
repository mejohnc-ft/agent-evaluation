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
