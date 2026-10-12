"use client";

import { useRef, type KeyboardEvent } from "react";

export type TabDef<T extends string> = { id: T; label: string };

// WAI-ARIA tabs with automatic activation: arrows, Home and End move focus and select. Only the
// selected tab is in the tab order (roving tabindex). Panels use `${idPrefix}-panel-${id}`.
export function Tabs<T extends string>({
  tabs,
  selected,
  onSelect,
  idPrefix,
  label,
}: {
  tabs: TabDef<T>[];
  selected: T;
  onSelect: (id: T) => void;
  idPrefix: string;
  label: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent, index: number) {
    const last = tabs.length - 1;
    const next = { ArrowRight: index === last ? 0 : index + 1, ArrowLeft: index === 0 ? last : index - 1, Home: 0, End: last }[
      e.key
    ];
    if (next === undefined) return;
    e.preventDefault();
    onSelect(tabs[next].id);
    refs.current[next]?.focus();
  }

  return (
    <div role="tablist" aria-label={label} className="flex gap-1 border-b border-hairline">
      {tabs.map((tab, i) => {
        const active = tab.id === selected;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${tab.id}`}
            aria-selected={active}
            aria-controls={`${idPrefix}-panel-${tab.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`-mb-px min-h-11 border-b-2 px-3 text-footnote font-medium transition-colors duration-300 ease-out-expo ${active ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
