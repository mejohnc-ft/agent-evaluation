import type { PageLinkOutput } from "@/lib/tools/ui-types";
import { ArrowUpRight } from "./icons";

// A cadre.ai page the reply points to. Quieter than NextStepCard: no button, no shadow; the whole
// card is the link. `page` is already validated (allowlisted host) by parsePageLink.
export function PageCard({ page }: { page: PageLinkOutput }) {
  const host = new URL(page.url).host;
  return (
    <a
      href={page.url}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="page-card"
      className="group flex min-h-11 animate-rise items-start gap-4 rounded-card border border-hairline bg-surface px-4 py-3.5 transition-[background-color,border-color] duration-300 ease-out-expo hover:border-hairline-strong hover:bg-sunken"
    >
      <span className="min-w-0 flex-1">
        <span className="eyebrow mb-1 block">From cadre.ai</span>
        <span className="block text-callout font-semibold text-ink">{page.label}</span>
        {page.description && <span className="mt-0.5 line-clamp-2 block text-callout text-muted">{page.description}</span>}
        <span className="mt-1.5 block truncate text-caption text-faint">{host}</span>
      </span>
      <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-faint transition-[color,transform] duration-500 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}
