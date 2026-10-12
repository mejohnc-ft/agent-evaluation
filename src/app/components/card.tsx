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
      className={`animate-rise rounded-card border bg-surface p-5 shadow-card sm:p-6 ${tone === "alert" ? "border-accent/40" : "border-hairline"}`}
    >
      <p className="eyebrow mb-3">{eyebrow}</p>
      {children}
    </section>
  );
}

// 44px minimum height: the HIG hit-target floor.
export const primaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-button bg-accent-fill px-5 text-callout font-medium text-white transition-[background-color,transform] duration-300 ease-out-expo hover:bg-accent-fill-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";
