import { tool } from "ai";
import { z } from "zod";
import type { ContactFormOutput } from "./ui-types";

// Renders a typed contact form in the chat (D14). Writes nothing; the form's submission arrives
// as the visitor's own message, and the model then calls request_human_followup.
export const showContactForm = tool({
  description:
    "Show the visitor a contact form (name, work email, company, what they need, consent) when they want the Cadre team to contact them and have not yet given their details. Use this instead of asking for an email in your reply.",
  inputSchema: z.object({
    intent: z.enum(["sales", "client_support", "security", "other"]),
    reason: z.string().max(200).describe("One line on what the visitor wants help with, shown above the form"),
  }),
  execute: async ({ intent, reason }): Promise<ContactFormOutput> => ({ form: "contact", intent, reason }),
});
