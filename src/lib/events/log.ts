import type { Store } from "../store/types";
import { appEvent, type AppEvent, type AppEventFields } from "./types";

// One request's events: kept in order for the reply's metadata, and written to the store best-effort
// (an events outage must never break a chat turn).
export function createEventLog(store: Pick<Store, "insertEvent"> | null, conversationId: string) {
  const events: AppEvent[] = [];
  const writes: Promise<void>[] = [];
  return {
    events,
    emit(fields: AppEventFields) {
      const event = appEvent(conversationId, fields);
      events.push(event);
      if (!store) return;
      writes.push(
        store.insertEvent(event).catch((error) => {
          console.error("event write failed", event.type, error instanceof Error ? error.message : error);
        }),
      );
    },
    flushed: () => Promise.all(writes).then(() => undefined),
  };
}

export type EventLog = ReturnType<typeof createEventLog>;
