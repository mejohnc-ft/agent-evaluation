import { block, pass, type GuardResult } from "./messages";

const EMAIL_PATTERN = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;

// A tool-argument email must be one the visitor typed, whole and verbatim (case-insensitive).
// userTexts are the visitor's own messages only (ToolContext.userTexts).
export function checkContactProvenance(email: string, userTexts: readonly string[]): GuardResult {
  const wanted = email.trim().toLowerCase();
  if (!wanted) return block("contact_unverified");
  const typed = userTexts.flatMap((text) => text.match(EMAIL_PATTERN) ?? []).map((e) => e.toLowerCase());
  return typed.includes(wanted) ? pass : block("contact_unverified");
}
