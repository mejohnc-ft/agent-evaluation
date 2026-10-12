import type { AppEvent } from "../events/types";
import type { GapRow, HandoffRow, Store, TurnRow } from "./types";

// In-memory Store for evals and tests. The arrays are exposed so callers can inspect writes.
// Rate windows are ignored: bumpRate counts every call per key.
export function createMemoryStore() {
  const handoffs: (HandoffRow & { id: string })[] = [];
  const gaps: GapRow[] = [];
  const turns: TurnRow[] = [];
  const events: AppEvent[] = [];
  const rates = new Map<string, number>();

  const store: Store = {
    async insertHandoff(row) {
      const id = crypto.randomUUID();
      handoffs.push({ ...row, id });
      return { id };
    },
    async insertGap(row) {
      gaps.push(row);
    },
    async insertTurn(row) {
      turns.push(row);
    },
    async insertEvent(event) {
      events.push(event);
    },
    async bumpRate(key) {
      const count = (rates.get(key) ?? 0) + 1;
      rates.set(key, count);
      return count;
    },
    async spendTodayUsd() {
      return turns.reduce((sum, turn) => sum + turn.costUsd, 0);
    },
  };
  return { ...store, handoffs, gaps, turns, events };
}

export type MemoryStore = ReturnType<typeof createMemoryStore>;
