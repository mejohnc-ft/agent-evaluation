import type { UIMessage } from "ai";
import { activityRow, activityTurns } from "./activity-events";

const time = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

// Backend events per reply, newest reply first; within a reply, the order they happened.
export function ActivityFeed({ messages }: { messages: UIMessage[] }) {
  const turns = activityTurns(messages);
  if (turns.length === 0) {
    return (
      <p className="py-6 text-footnote text-muted">
        Activity from the assistant&apos;s backend appears here: safety checks, tools, saved requests and cost per reply.
      </p>
    );
  }
  return (
    <ol className="flex flex-col gap-6 py-5" aria-label="Activity by reply">
      {turns.map((turn) => (
        <li key={turn.id} className="animate-rise">
          <h3 className="eyebrow mb-2">
            Reply {turn.number} · <time dateTime={turn.events[0].at}>{time(turn.events[0].at)}</time>
          </h3>
          <ul className="flex flex-col gap-2 border-l border-hairline pl-3">
            {turn.events.map((event, i) => {
              const row = activityRow(event);
              return (
                <li key={i} data-testid="activity-row" className="flex flex-col items-start gap-0.5">
                  <span className={`text-footnote ${row.tone === "error" ? "text-accent-ink" : "text-ink-2"}`}>{row.text}</span>
                  <span className="rounded-[0.25rem] bg-sunken px-1 font-mono text-caption tracking-normal text-faint">
                    {row.badge}
                  </span>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ol>
  );
}
