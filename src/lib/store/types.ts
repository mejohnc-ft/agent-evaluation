// The persistence contract. Supabase in production (store/supabase.ts), in-memory for evals
// and tests (store/memory.ts). Nothing else imports a database client.

export type HandoffRow = {
  conversationId: string;
  name: string;
  email: string;
  company: string | null;
  intent: "sales" | "client_support" | "security" | "other";
  summary: string;
};

export type GapRow = {
  conversationId: string;
  question: string;
  topic: string | null;
};

// Stored without contact details: emails are redacted before insertTurn.
export type TurnRow = {
  conversationId: string;
  userText: string;
  replyText: string;
  toolCalls: string[];
  model: string;
  promptHash: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
};

export interface Store {
  insertHandoff(row: HandoffRow): Promise<{ id: string }>;
  insertGap(row: GapRow): Promise<void>;
  insertTurn(row: TurnRow): Promise<void>;
  // Increments the counter for `key` in the current fixed window and returns the new count.
  bumpRate(key: string, windowSeconds: number): Promise<number>;
  // Sum of costUsd for turns since 00:00 UTC today.
  spendTodayUsd(): Promise<number>;
}

// Passed to tool handlers. userTexts are the visitor's own messages, for contact provenance.
export type ToolContext = {
  store: Store;
  conversationId: string;
  userTexts: string[];
};
