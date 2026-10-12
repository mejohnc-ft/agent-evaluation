import type { BookingLinkOutput, BookingPurpose } from "@/lib/tools/ui-types";
import { Card, primaryButton } from "./card";
import { ArrowUpRight } from "./icons";

const COPY: Record<BookingPurpose, { title: string; line: string; cta: string }> = {
  strategy_call: {
    title: "Talk to an AI Strategist",
    line: "Share your goals and a strategist will follow up.",
    cta: "Talk to an AI Strategist",
  },
  ai_maturity_index: {
    title: "AI Maturity Index",
    line: "Free self-assessment, about 10 minutes, graded across eight pillars.",
    cta: "Take the AI Maturity Index",
  },
};

// `link` is already validated (allowlisted host) by parseBookingLink.
export function NextStepCard({ link }: { link: BookingLinkOutput }) {
  const copy = COPY[link.purpose];
  return (
    <Card eyebrow="Next step" testId="next-step-card">
      <h2 className="text-headline font-semibold text-ink">{copy.title}</h2>
      <p className="mt-1 text-callout text-muted">{copy.line}</p>
      <a href={link.url} target="_blank" rel="noopener noreferrer" className={`group mt-5 w-full sm:w-auto ${primaryButton}`}>
        {copy.cta}
        <ArrowUpRight className="size-4 transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </Card>
  );
}
