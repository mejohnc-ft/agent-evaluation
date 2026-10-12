import { tool } from "ai";
import { z } from "zod";
import type { ToolContext } from "../store/types";

export function logKnowledgeGap(ctx: ToolContext) {
  return tool({
    description:
      "Record a visitor question the knowledge base does not answer, so Cadre can fill the gap. Call it once whenever you tell the visitor you don't have that information. Do not include names, emails or other contact details.",
    inputSchema: z.object({
      question: z.string().min(3).max(500).describe("The visitor's question, paraphrased without personal details"),
      topic: z.string().max(60).nullable().describe("A short topic label, e.g. offices, pricing, careers"),
    }),
    execute: async ({ question, topic }) => {
      await ctx.store.insertGap({ conversationId: ctx.conversationId, question, topic });
      return { logged: true };
    },
  });
}
