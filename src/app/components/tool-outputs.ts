import { z } from "zod";
import type { BookingLinkOutput, ContactFormOutput, HandoffOutput } from "@/lib/tools/ui-types";

// Tool outputs arrive over the network: parse before rendering, and render nothing on a mismatch.
export const ALLOWED_LINK_PREFIXES = ["https://cadre.ai/", "https://portal.gocadre.ai/"] as const;

const bookingLink: z.ZodType<BookingLinkOutput> = z.object({
  purpose: z.enum(["strategy_call", "ai_maturity_index"]),
  label: z.string(),
  url: z.string().refine((url) => ALLOWED_LINK_PREFIXES.some((prefix) => url.startsWith(prefix))),
  cta: z.string(),
});

const contactForm: z.ZodType<ContactFormOutput> = z.object({
  form: z.literal("contact"),
  intent: z.enum(["sales", "client_support", "security", "other"]),
  reason: z.string().max(300),
});

const handoff: z.ZodType<HandoffOutput> = z.union([
  z.object({ ok: z.literal(true), id: z.string().min(1) }),
  z.object({ ok: z.literal(false), error: z.string() }),
]);

function parser<T>(schema: z.ZodType<T>) {
  return (value: unknown): T | null => {
    const result = schema.safeParse(value);
    return result.success ? result.data : null;
  };
}

export const parseBookingLink = parser(bookingLink);
export const parseContactForm = parser(contactForm);
export const parseHandoff = parser(handoff);
