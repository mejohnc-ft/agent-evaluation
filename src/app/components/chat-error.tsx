import { Alert, Retry } from "./icons";

// Friendly, fixed copy: the raw error never reaches the page.
export function ChatError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      data-testid="chat-error"
      className="flex animate-rise flex-wrap items-center gap-x-4 gap-y-3 rounded-card border border-hairline bg-sunken px-4 py-3"
    >
      <p className="flex min-w-0 flex-1 items-start gap-2.5 text-[0.9375rem] leading-relaxed text-ink-2">
        <Alert className="mt-[0.2rem] size-4 shrink-0 text-accent-ink" />
        Something went wrong on our side. Try again, or email hello@gocadre.ai.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-button border border-hairline-strong bg-surface px-3.5 py-1.5 text-sm font-medium text-ink transition-colors duration-300 ease-out-expo hover:bg-sunken"
      >
        <Retry className="size-3.5" />
        Try again
      </button>
    </div>
  );
}
