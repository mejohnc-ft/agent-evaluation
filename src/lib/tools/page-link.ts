import { tool } from "ai";
import { z } from "zod";
import { linkFor } from "../links";
import { pageSummary } from "../page-summary";
import type { PageLinkOutput } from "./ui-types";

// links.md labels a visitor can be pointed to as a card (D18). Contact and the AI Maturity Index
// go through get_booking_link, which carries their call to action.
export const PAGE_LABELS = [
  "About Cadre",
  "Case studies",
  "Privacy policy",
  "OpenAI partner article",
  "AI Strategy",
  "AI Leadership & Facilitation",
  "AI Engineering",
  "AI Agents",
  "Industries index",
  "Professional Services",
  "Private Equity",
  "Real Estate",
  "Financial Services",
  "Mortgage & Lending",
  "Construction",
  "Retail & E-commerce",
  "Manufacturing & Logistics",
  "Hospitality",
  "Departments",
] as const;

export const getPageLink = tool({
  description:
    "Show the visitor a card linking to the cadre.ai page your answer draws on (for example Case studies or an industry page). Call it once per answer, for the single most relevant page. The page shows the card below your reply; never write the URL.",
  inputSchema: z.object({ page: z.enum(PAGE_LABELS) }),
  execute: async ({ page }): Promise<PageLinkOutput> => {
    const link = linkFor(page);
    return { ...link, description: pageSummary(link.url) };
  },
});
