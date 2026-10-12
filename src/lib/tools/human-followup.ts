import { tool } from "ai";
import { z } from "zod";
import { checkContactProvenance } from "../guards/contact-provenance";
import { notifyHandoff } from "../notify";
import type { ToolContext } from "../store/types";

export function requestHumanFollowup(ctx: ToolContext) {
  return tool({
    description:
      "Ask the Cadre team to contact the visitor. Call only after the visitor has typed their own name and email in this conversation and agreed to be contacted. Copy the email exactly as they typed it.",
    inputSchema: z.object({
      name: z.string().min(1).max(120),
      email: z.email().max(254),
      company: z.string().max(160).nullable(),
      intent: z.enum(["sales", "client_support", "security", "other"]),
      summary: z.string().min(10).max(1000).describe("What the visitor needs, in two or three sentences, for the Cadre team"),
    }),
    execute: async (input) => {
      const provenance = checkContactProvenance(input.email, ctx.userTexts);
      if (!provenance.ok) return { ok: false, error: provenance.message };
      try {
        const row = { ...input, conversationId: ctx.conversationId };
        const { id } = await ctx.store.insertHandoff(row);
        await notifyHandoff({ ...row, id });
        return { ok: true, id };
      } catch (error) {
        console.error("handoff insert failed", error instanceof Error ? error.message : error);
        return { ok: false, error: "The request could not be saved. Give the visitor hello@gocadre.ai instead." };
      }
    },
  });
}
