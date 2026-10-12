import { convertToModelMessages, type UIMessage } from "ai";
import { generateReply } from "@/lib/reply";

const FALLBACK = "Sorry, I couldn't answer just now. Please try again, or reach the team at cadre.ai/contact.";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.messages)) return Response.json({ error: "messages must be an array" }, { status: 400 });

  const result = generateReply(await convertToModelMessages(body.messages as UIMessage[]));
  return result.toUIMessageStreamResponse({
    onError: (error) => {
      console.error("chat stream failed", error);
      return FALLBACK;
    },
  });
}
