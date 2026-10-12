import { tool } from "ai";
import { z } from "zod";
import { linkFor } from "../links";
import type { BookingLinkOutput } from "./ui-types";

const LINKS = {
  strategy_call: { label: "Contact Cadre", cta: "Talk to an AI Strategist" },
  ai_maturity_index: { label: "AI Maturity Index (portal)", cta: "Take the AI Maturity Index" },
} as const;

// The UI renders the returned link as a next-step card; the model never writes the URL itself.
export const getBookingLink = tool({
  description:
    "Get the link the visitor needs to book a call with an AI strategist (purpose strategy_call) or to take the AI Maturity Index themselves (purpose ai_maturity_index). Call it whenever you suggest either; the page shows the link as a button, so never write the URL in your reply.",
  inputSchema: z.object({ purpose: z.enum(["strategy_call", "ai_maturity_index"]) }),
  execute: async ({ purpose }): Promise<BookingLinkOutput> => ({ purpose, ...linkFor(LINKS[purpose].label), cta: LINKS[purpose].cta }),
});
