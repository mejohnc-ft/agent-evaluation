import { ArrowRight } from "./icons";

export const STARTERS = [
  "What does Cadre do?",
  "Do you work with private equity firms?",
  "How does the AI Maturity Index work?",
  "I'd like to talk to a strategist",
] as const;

export function EmptyState({ onPick, disabled }: { onPick: (text: string) => void; disabled: boolean }) {
  return (
    <section aria-labelledby="welcome-title" className="animate-rise pt-[12vh] pb-10 sm:pt-[16vh]">
      <p className="mb-4 flex items-center gap-2 text-xs font-medium tracking-[0.08em] text-muted uppercase">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
        Cadre AI Assistant
      </p>
      <h1 id="welcome-title" className="text-[1.875rem] leading-[1.15] font-semibold tracking-[-0.035em] text-ink sm:text-[2.25rem]">
        How can we help?
      </h1>
      <p className="mt-3 max-w-[32rem] text-base leading-relaxed text-pretty text-muted">
        Ask about Cadre&apos;s services, industries, or how to work with the team.
      </p>
      <ul className="mt-8 grid gap-2 sm:grid-cols-2">
        {STARTERS.map((text) => (
          <li key={text}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(text)}
              className="group flex h-full w-full items-center justify-between gap-3 rounded-card border border-hairline bg-surface px-4 py-3.5 text-left text-[0.9375rem] leading-snug text-ink-2 transition-[background-color,border-color,color] duration-300 ease-out-expo hover:border-hairline-strong hover:bg-sunken hover:text-ink disabled:opacity-50"
            >
              {text}
              <ArrowRight className="size-4 shrink-0 text-faint transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5 group-hover:text-ink" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
