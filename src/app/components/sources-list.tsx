"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { ArrowUpRight, Retry } from "./icons";
import { isAllowedLink } from "./tool-outputs";

// The response crosses the network: validate it, and drop any source off the link allowlist.
const sourcesSchema = z.array(
  z.object({ file: z.string(), title: z.string().min(1), url: z.string(), verified: z.iso.date() }),
);
type Source = z.infer<typeof sourcesSchema>[number];
type State = { status: "loading" } | { status: "error" } | { status: "ready"; sources: Source[] };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// "2026-10-12" → "12 Oct 2026", without a timezone shift.
const verifiedOn = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

// Mounted the first time the Sources tab opens, then kept, so the list is fetched once.
export function SourcesList() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/sources", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: unknown) => {
        const parsed = sourcesSchema.parse(data).filter((s) => isAllowedLink(s.url));
        setState({ status: "ready", sources: parsed });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: "error" });
      });
    return () => controller.abort();
  }, [attempt]);

  if (state.status === "loading") return <p className="py-6 text-footnote text-muted" role="status">Loading sources…</p>;
  if (state.status === "error") {
    return (
      <div className="flex flex-col items-start gap-2 py-6">
        <p className="text-footnote text-muted">Sources couldn&apos;t load just now.</p>
        <button
          type="button"
          onClick={() => {
            setState({ status: "loading" });
            setAttempt((n) => n + 1);
          }}
          className="inline-flex min-h-11 items-center gap-2 rounded-button border border-hairline-strong px-4 text-footnote font-medium text-ink hover:bg-sunken"
        >
          <Retry className="size-3.5" />
          Try again
        </button>
      </div>
    );
  }
  return (
    <>
      <p className="pt-5 pb-3 text-footnote text-muted">
        The assistant answers only from these {state.sources.length} pages.
      </p>
      <ul className="flex flex-col gap-2 pb-5">
        {state.sources.map((s) => (
          <li key={s.file}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="source-link"
              className="group flex min-h-11 items-start gap-3 rounded-input border border-hairline px-3 py-2.5 transition-[background-color,border-color] duration-300 ease-out-expo hover:border-hairline-strong hover:bg-sunken"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-footnote font-medium text-ink">{s.title}</span>
                <span className="block truncate text-caption text-muted">
                  {new URL(s.url).host} · Verified {verifiedOn(s.verified)}
                </span>
              </span>
              <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-faint group-hover:text-ink" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
