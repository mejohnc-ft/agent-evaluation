import { createClient } from "@supabase/supabase-js";
import type { GapRow, HandoffRow, Store, TurnRow } from "./types";

// Supabase is a trust boundary: any error becomes a StoreError, never a partial success.
export class StoreError extends Error {
  name = "StoreError";
}

function fail(op: string, error: { message: string } | null): never {
  throw new StoreError(`${op} failed${error ? `: ${error.message}` : ""}`);
}

// Env is read here, not at module load, so the build needs no secrets.
export function createSupabaseStore(): Store {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new StoreError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  return {
    async insertHandoff(row: HandoffRow) {
      const { data, error } = await db
        .from("handoffs")
        .insert({
          conversation_id: row.conversationId,
          name: row.name,
          email: row.email,
          company: row.company,
          intent: row.intent,
          summary: row.summary,
        })
        .select("id")
        .single();
      if (error || typeof data?.id !== "string") fail("insertHandoff", error);
      return { id: data.id };
    },

    async insertGap(row: GapRow) {
      const { error } = await db.from("knowledge_gaps").insert({
        conversation_id: row.conversationId,
        question: row.question,
        topic: row.topic,
      });
      if (error) fail("insertGap", error);
    },

    async insertTurn(row: TurnRow) {
      const { error } = await db.from("conversation_turns").insert({
        conversation_id: row.conversationId,
        user_text: row.userText,
        reply_text: row.replyText,
        tool_calls: row.toolCalls,
        model: row.model,
        prompt_hash: row.promptHash,
        input_tokens: row.inputTokens,
        output_tokens: row.outputTokens,
        cost_usd: row.costUsd,
        latency_ms: row.latencyMs,
      });
      if (error) fail("insertTurn", error);
    },

    async bumpRate(key: string, windowSeconds: number) {
      const { data, error } = await db.rpc("bump_rate", { p_key: key, p_window_seconds: windowSeconds });
      if (error || typeof data !== "number") fail("bumpRate", error);
      return data;
    },

    async spendTodayUsd() {
      const now = new Date();
      const startOfTodayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const { data, error } = await db
        .from("conversation_turns")
        .select("cost_usd")
        .gte("created_at", startOfTodayUtc.toISOString());
      if (error || !data) fail("spendTodayUsd", error);
      // numeric columns arrive as strings or numbers depending on precision.
      return data.reduce((sum, r) => sum + Number(r.cost_usd), 0);
    },
  };
}
