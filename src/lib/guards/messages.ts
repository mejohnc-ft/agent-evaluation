// Every guard's refusal text in one place. All are shown to the visitor except contact_unverified,
// which goes back to the model as a tool result.
export const VISITOR_MESSAGES = {
  input_invalid: "Sorry, I couldn't read that message. Please try sending it again.",
  input_too_long: "That message is a bit long for me. Could you shorten it to under 2,000 characters?",
  too_many_messages: "This conversation has got quite long. Please refresh the page to start a new one.",
  rate_limited: "You're sending messages faster than I can keep up. Please wait a few minutes and try again.",
  bot_blocked:
    "I couldn't verify this browser. Please reload the page and try again, or email hello@gocadre.ai.",
  spend_limit:
    "I'm not able to answer right now. Please email hello@gocadre.ai and the team will get back to you.",
  contact_unverified:
    "That email was not typed by the visitor. Ask them to type their email address in the chat, then try again.",
} as const;

export type GuardReason = keyof typeof VISITOR_MESSAGES;

export type GuardResult = { ok: true } | { ok: false; reason: GuardReason; message: string };

export const pass: GuardResult = { ok: true };

export const block = (reason: GuardReason): GuardResult => ({ ok: false, reason, message: VISITOR_MESSAGES[reason] });
