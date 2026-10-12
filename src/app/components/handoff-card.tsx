import type { HandoffOutput } from "@/lib/tools/ui-types";
import { Card } from "./card";
import { Alert, Check } from "./icons";

// Confirms only when the server reports ok === true (the handoff row was written).
export function HandoffCard({ result }: { result: HandoffOutput }) {
  if (result.ok === true) {
    return (
      <Card eyebrow="Follow-up requested" testId="handoff-card">
        <div className="flex gap-3">
          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-ink-fill text-on-ink">
            <Check className="size-3.5" />
          </span>
          <div>
            <p className="text-[0.9375rem] leading-relaxed text-ink">
              Request sent. The Cadre team usually replies by the next business day.
            </p>
            <p className="mt-1.5 text-xs text-muted">
              Reference <span className="font-mono tracking-normal text-ink-2">{result.id.slice(0, 8)}</span>
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card eyebrow="Follow-up not sent" testId="handoff-card" tone="alert">
      <div className="flex gap-3">
        <Alert className="mt-0.5 size-5 shrink-0 text-accent" />
        <p className="text-[0.9375rem] leading-relaxed text-ink-2">
          We couldn&apos;t send your request just now. Please email{" "}
          <a href="mailto:hello@gocadre.ai" className="font-medium text-ink underline decoration-hairline-strong underline-offset-4 hover:decoration-ink">
            hello@gocadre.ai
          </a>{" "}
          and the team will pick it up from there.
        </p>
      </div>
    </Card>
  );
}
