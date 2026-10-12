"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ArrowUp } from "./icons";

export const MAX_CHARS = 2000;
const COUNTER_FROM = 1600;
const MAX_HEIGHT_PX = 200;

export function Composer({ onSend, busy }: { onSend: (text: string) => void; busy: boolean }) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const canSend = !busy && value.trim().length > 0;

  // Grow with the content up to MAX_HEIGHT_PX, then scroll inside the textarea.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [value]);

  function submit() {
    if (!canSend) return;
    onSend(value.trim());
    setValue("");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-end gap-2 rounded-[1.75rem] border border-hairline-strong bg-surface p-2 shadow-card transition-[border-color,box-shadow] duration-300 ease-out-expo focus-within:border-ink/60 focus-within:ring-[3px] focus-within:ring-ink/8"
    >
      <label htmlFor="composer" className="sr-only">
        Message the Cadre AI assistant
      </label>
      <textarea
        id="composer"
        ref={ref}
        rows={1}
        value={value}
        maxLength={MAX_CHARS}
        placeholder="Ask about Cadre AI…"
        aria-describedby="composer-help"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        className="block max-h-[200px] min-h-11 min-w-0 flex-1 resize-none bg-transparent py-2.5 pl-3 text-body text-ink placeholder:text-faint focus:outline-none focus-visible:outline-none"
      />
      <div className="flex shrink-0 items-center gap-3">
        {value.length >= COUNTER_FROM && (
          <span
            className={`text-caption tabular-nums ${value.length >= MAX_CHARS - 50 ? "text-accent-ink" : "text-muted"}`}
            aria-label={`${value.length} of ${MAX_CHARS} characters`}
          >
            {value.length.toLocaleString("en-US")} / {MAX_CHARS.toLocaleString("en-US")}
          </span>
        )}
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send message"
          className="grid size-11 place-items-center rounded-full bg-ink-fill text-on-ink transition-[background-color,opacity,transform] duration-300 ease-out-expo hover:bg-ink-fill-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-25"
        >
          <ArrowUp className="size-[1.125rem]" />
        </button>
      </div>
    </form>
  );
}
