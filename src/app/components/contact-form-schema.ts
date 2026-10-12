import { z } from "zod";
import type { ContactFormFields } from "@/lib/tools/ui-types";

// Client-side checks only; the server's provenance guard and tool schema stay authoritative.
// Limits mirror request_human_followup's input schema so a valid form never fails the tool.
export const contactFormSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(120, "Keep your name under 120 characters."),
  email: z
    .string()
    .trim()
    .min(1, "Enter your work email.")
    .max(254, "That email is too long.")
    .pipe(z.email("Enter a valid email, like name@company.com.")),
  company: z.string().trim().max(160, "Keep the company name under 160 characters."),
  need: z
    .string()
    .trim()
    .min(10, "Add a sentence so the team can prepare.")
    .max(1000, "Keep this under 1,000 characters."),
  consent: z.literal(true, "Please agree to be contacted so the team can reply."),
});

export type ContactFormErrors = Partial<Record<keyof z.infer<typeof contactFormSchema>, string>>;

export function validateContactForm(
  raw: Record<string, unknown>,
): { ok: true; fields: ContactFormFields } | { ok: false; errors: ContactFormErrors } {
  const result = contactFormSchema.safeParse(raw);
  if (result.success) {
    const { name, email, company, need } = result.data;
    return { ok: true, fields: { name, email, company, need } };
  }
  const errors: ContactFormErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof ContactFormErrors;
    errors[key] ??= issue.message;
  }
  return { ok: false, errors };
}
