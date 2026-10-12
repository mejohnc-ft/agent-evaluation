import { ArrowRight } from "./icons";

export const STARTERS = [
  "What does Cadre do?",
  "Do you work with private equity firms?",
  "How does the AI Maturity Index work?",
  "I'd like to talk to a strategist",
] as const;

// Centred in the space between the header and the composer, so the first view is balanced.
export function EmptyState({ onPick, disabled }: { onPick: (text: string) => void; disabled: boolean }) {
  return (
    <section
      aria-labelledby="welcome-title"
      className="flex min-h-[calc(100dvh-13rem)] animate-rise flex-col justify-center py-10"
    >
      <p className="eyebrow mb-4 flex items-center gap-2">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
        Cadre AI Assistant
      </p>
      <h1 id="welcome-title" className="text-display font-semibold text-balance text-ink">
        How can we help?
      </h1>
      <p className="mt-3 max-w-[32rem] text-body text-pretty text-muted">
        Ask about Cadre&apos;s services, industries, or how to work with the team.
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {STARTERS.map((text) => (
          <li key={text}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(text)}
              className="group flex h-full min-h-12 w-full items-center justify-between gap-3 rounded-card border border-hairline bg-surface px-4 py-3 text-left text-callout text-ink-2 transition-[background-color,border-color,color] duration-300 ease-out-expo hover:border-hairline-strong hover:bg-sunken hover:text-ink disabled:opacity-50"
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
