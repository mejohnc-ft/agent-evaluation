// Tool output shapes the chat UI renders as cards (generative UI). Shared by tools and src/app.

export type BookingPurpose = "strategy_call" | "ai_maturity_index";
export type HandoffIntent = "sales" | "client_support" | "security" | "other";

export type BookingLinkOutput = { purpose: BookingPurpose; label: string; url: string; cta: string };
export type ContactFormOutput = { form: "contact"; intent: HandoffIntent; reason: string };
export type HandoffOutput = { ok: true; id: string } | { ok: false; error: string };
export type GapOutput = { logged: true };

// The contact form submits this text as the visitor's own message, so contact provenance holds
// (the email is typed by the visitor) and request_human_followup stays the only handoff path.
export const CONTACT_FORM_HEADER = "Contact details for follow-up:";
export const CONTACT_FORM_CONSENT = "I agree to be contacted by Cadre.";

export type ContactFormFields = { name: string; email: string; company: string; need: string };

export function contactFormMessage(f: ContactFormFields): string {
  return [
    CONTACT_FORM_HEADER,
    `Name: ${f.name}`,
    `Email: ${f.email}`,
    `Company: ${f.company || "-"}`,
    `Need: ${f.need}`,
    CONTACT_FORM_CONSENT,
  ].join("\n");
}
