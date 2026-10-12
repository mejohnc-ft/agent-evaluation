import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean };

// 44px icon button with a visible tooltip on hover and keyboard focus. The tooltip repeats the
// accessible name, so it stays hidden from assistive tech. Pressing with a pointer doesn't take
// focus: whatever had it (usually the composer) keeps it.
export function IconButton({ label, active = false, children, ...rest }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      className={`group relative grid size-11 shrink-0 place-items-center rounded-full text-muted transition-[background-color,color] duration-300 ease-out-expo hover:bg-sunken hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent ${active ? "bg-sunken text-ink" : ""}`}
      {...rest}
    >
      {children}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-full right-0 z-30 mt-1 rounded-input bg-ink-fill px-2 py-1 text-caption font-medium whitespace-nowrap text-on-ink opacity-0 shadow-card transition-opacity duration-300 ease-out-expo group-hover:opacity-100 group-hover:delay-300 group-focus-visible:opacity-100"
      >
        {label}
      </span>
    </button>
  );
}
