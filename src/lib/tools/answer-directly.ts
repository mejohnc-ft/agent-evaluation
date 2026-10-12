import { tool } from "ai";
import { z } from "zod";

// Every turn starts with a required tool decision (reply.ts), so a reply can never promise a card,
// a link or a logged gap and then stop before calling the tool. This is the "nothing else needed"
// choice. It does nothing and renders nothing.
export const answerDirectly = tool({
  description:
    "Call this when your reply needs none of the other tools. Each turn begins by calling the tools the reply needs, or this one.",
  inputSchema: z.object({}),
  execute: async () => ({ ok: true as const }),
});
