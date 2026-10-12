// Shared shell for generative cards: hairline border, Cadre card radius and shadow, small eyebrow.
export function Card({
  eyebrow,
  children,
  testId,
  tone = "default",
}: {
  eyebrow: string;
  children: React.ReactNode;
  testId: string;
  tone?: "default" | "alert";
}) {
  return (
    <section
      data-testid={testId}
      aria-label={eyebrow}
      className={`animate-rise rounded-card border bg-surface p-5 shadow-card ${tone === "alert" ? "border-accent/40" : "border-hairline"}`}
    >
      <p className="mb-2 text-[0.6875rem] font-medium tracking-[0.08em] text-muted uppercase">{eyebrow}</p>
      {children}
    </section>
  );
}

export const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-button bg-accent-fill px-5 py-2.5 text-[0.9375rem] font-medium tracking-[-0.01em] text-white transition-[background-color,transform] duration-300 ease-out-expo hover:bg-accent-fill-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";
