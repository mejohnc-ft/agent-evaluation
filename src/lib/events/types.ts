import { z } from "zod";
import { redactContacts } from "../redact";

// Typed backend events (D17): written to the `events` table and streamed to this browser's
// "Behind the scenes" panel as message metadata. Never carry contact details.

const base = { conversationId: z.string().min(1).max(100), at: z.iso.datetime() };

export const appEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("guard_checked"),
    ...base,
    guard: z.enum(["input_cap", "bot", "rate_limit", "spend", "price"]),
    outcome: z.enum(["pass", "block", "skipped"]),
  }),
  z.object({ type: z.literal("tool_called"), ...base, tool: z.string().min(1).max(60) }),
  z.object({ type: z.literal("handoff_saved"), ...base, handoffId: z.string().min(1).max(64) }),
  z.object({ type: z.literal("gap_logged"), ...base, topic: z.string().max(60).nullable() }),
  z.object({
    type: z.literal("turn_completed"),
    ...base,
    model: z.string().max(100),
    promptHash: z.string().max(32),
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    costUsd: z.number().nonnegative(),
    latencyMs: z.number().int().nonnegative(),
  }),
  z.object({ type: z.literal("error"), ...base, where: z.string().max(60), message: z.string().max(300) }),
]);

export type AppEvent = z.infer<typeof appEventSchema>;
export type AppEventType = AppEvent["type"];

// Event fields as callers write them: everything but the id and timestamp, per event type.
export type AppEventFields = AppEvent extends infer E ? (E extends AppEvent ? Omit<E, "conversationId" | "at"> : never) : never;

// Builds a validated event stamped now; free text is redacted and clipped before validation.
export function appEvent(conversationId: string, fields: AppEventFields): AppEvent {
  const clean = fields.type === "error" ? { ...fields, message: redactContacts(fields.message).slice(0, 300) } : fields;
  return appEventSchema.parse({ ...clean, conversationId, at: new Date().toISOString() });
}

// Per-reply metadata the route attaches to the stream; the panel renders `events`.
export type MessageMetadata = { events: AppEvent[] };
