import { matchesSecret } from "./secrets";

// D15: how long each table keeps rows. Handoffs are the lead record until a CRM exists.
export const RETENTION = [
  { table: "conversation_turns", column: "created_at", days: 90 },
  { table: "knowledge_gaps", column: "created_at", days: 180 },
  { table: "rate_counters", column: "window_start", days: 1 },
  { table: "handoffs", column: "created_at", days: 365 },
] as const;

const DAY_MS = 86_400_000;

export function retentionCutoffs(now: Date) {
  return RETENTION.map(({ table, column, days }) => ({
    table,
    column,
    before: new Date(now.getTime() - days * DAY_MS).toISOString(),
  }));
}

// Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. No secret configured means no access.
export function isAuthorizedCron(header: string | null, secret: string | undefined): boolean {
  return Boolean(secret) && matchesSecret(header, `Bearer ${secret}`);
}
