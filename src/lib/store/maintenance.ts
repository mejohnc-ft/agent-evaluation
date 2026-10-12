import { retentionCutoffs } from "../retention";
import { serviceClient, StoreError } from "./supabase";

// Retention and deletion requests (D15). Separate from Store: the chat path never deletes.

export async function purgeExpired(now: Date): Promise<Record<string, number>> {
  const db = serviceClient();
  const deleted: Record<string, number> = {};
  for (const { table, column, before } of retentionCutoffs(now)) {
    const { count, error } = await db.from(table).delete({ count: "exact" }).lt(column, before);
    if (error) throw new StoreError(`purge ${table} failed: ${error.message}`);
    deleted[table] = count ?? 0;
  }
  return deleted;
}

// A deletion request by email removes that person's handoffs and every conversation they were in;
// by conversation id, everything from that conversation.
export async function deleteContact(by: { email: string } | { conversationId: string }): Promise<Record<string, number>> {
  const db = serviceClient();
  let conversationIds: string[];
  if ("email" in by) {
    const { data, error } = await db.from("handoffs").select("conversation_id").ilike("email", escapeLike(by.email));
    if (error) throw new StoreError(`lookup failed: ${error.message}`);
    conversationIds = [...new Set(data.map((r) => r.conversation_id as string))];
  } else {
    conversationIds = [by.conversationId];
  }

  const deleted: Record<string, number> = {};
  for (const table of ["handoffs", "knowledge_gaps", "conversation_turns", "events"] as const) {
    const { count, error } = await db.from(table).delete({ count: "exact" }).in("conversation_id", conversationIds);
    if (error) throw new StoreError(`delete ${table} failed: ${error.message}`);
    deleted[table] = count ?? 0;
  }
  if ("email" in by) {
    // Handoffs carrying the email outside a recorded conversation id.
    const { count, error } = await db.from("handoffs").delete({ count: "exact" }).ilike("email", escapeLike(by.email));
    if (error) throw new StoreError(`delete handoffs failed: ${error.message}`);
    deleted.handoffs += count ?? 0;
  }
  return deleted;
}

// ilike gives a case-insensitive exact match once the pattern characters are escaped.
const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);
