import { Resend } from "resend";
import type { HandoffRow } from "./store/types";

const FROM = "Cadre Assistant <onboarding@resend.dev>";

// Best-effort email to the owner inbox. The handoffs row is the record; this never throws.
export async function notifyHandoff(row: HandoffRow & { id: string }): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.HANDOFF_NOTIFY_EMAIL;
  if (!apiKey || !to) return false;

  const text = [
    row.summary,
    "",
    `Name: ${row.name}`,
    `Email: ${row.email}`,
    `Company: ${row.company ?? "-"}`,
    `Intent: ${row.intent}`,
    `Conversation: ${row.conversationId}`,
    `Handoff id: ${row.id}`,
  ].join("\n");

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from: FROM,
      to,
      subject: `New handoff: ${row.intent} from ${row.company ?? row.name}`,
      text,
    });
    if (error) {
      console.error("handoff notify failed", { handoffId: row.id, name: error.name, message: error.message });
      return false;
    }
    return true;
  } catch (err) {
    console.error("handoff notify failed", { handoffId: row.id, message: err instanceof Error ? err.message : String(err) });
    return false;
  }
}
