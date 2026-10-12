// Same height as one line of prose, so the first token replaces it without a layout shift.
export function TypingIndicator() {
  return (
    <div className="flex h-[1.625rem] items-center gap-1" role="status">
      <span className="sr-only">The assistant is typing</span>
      {[0, 160, 320].map((delay) => (
        <span
          key={delay}
          aria-hidden="true"
          className="size-1.5 animate-pulse-dot rounded-full bg-muted"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}
