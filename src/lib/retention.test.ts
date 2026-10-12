import { describe, expect, it } from "vitest";
import { isAuthorizedCron, RETENTION, retentionCutoffs } from "./retention";

describe("retention", () => {
  it("keeps the documented periods (D15)", () => {
    expect(Object.fromEntries(RETENTION.map((r) => [r.table, r.days]))).toEqual({
      conversation_turns: 90,
      events: 90,
      knowledge_gaps: 180,
      rate_counters: 1,
      handoffs: 365,
    });
  });

  it("computes each cutoff back from now", () => {
    const now = new Date("2026-10-12T04:00:00.000Z");
    expect(retentionCutoffs(now)).toEqual([
      { table: "conversation_turns", column: "created_at", before: "2026-07-14T04:00:00.000Z" },
      { table: "events", column: "created_at", before: "2026-07-14T04:00:00.000Z" },
      { table: "knowledge_gaps", column: "created_at", before: "2026-04-15T04:00:00.000Z" },
      { table: "rate_counters", column: "window_start", before: "2026-10-11T04:00:00.000Z" },
      { table: "handoffs", column: "created_at", before: "2025-10-12T04:00:00.000Z" },
    ]);
  });

  it("accepts only the exact bearer secret", () => {
    expect(isAuthorizedCron("Bearer s3cret-value", "s3cret-value")).toBe(true);
    expect(isAuthorizedCron("Bearer wrong", "s3cret-value")).toBe(false);
    expect(isAuthorizedCron(null, "s3cret-value")).toBe(false);
  });

  it("refuses everything when no secret is configured", () => {
    expect(isAuthorizedCron("Bearer ", "")).toBe(false);
    expect(isAuthorizedCron("Bearer undefined", undefined)).toBe(false);
  });
});
