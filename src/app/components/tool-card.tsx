import type { UIMessage } from "ai";
import type { ContactFormFields } from "@/lib/tools/ui-types";
import { ContactFormCard } from "./contact-form-card";
import { HandoffCard } from "./handoff-card";
import { NextStepCard } from "./next-step-card";
import { PageCard } from "./page-card";
import { parseBookingLink, parseContactForm, parseHandoff, parsePageLink } from "./tool-outputs";

type Part = UIMessage["parts"][number];

export type ToolCardContext = {
  contactSubmitted: boolean;
  busy: boolean;
  onContactSubmit: (fields: ContactFormFields) => void;
};

// Renders a finished tool call as a card. Anything unexpected (other states, other tools such as
// log_knowledge_gap, or an output that fails validation) renders nothing.
export function ToolCard({ part, ctx }: { part: Part; ctx: ToolCardContext }) {
  if (!("state" in part) || part.state !== "output-available") return null;
  const output: unknown = part.output;

  switch (part.type) {
    case "tool-get_booking_link": {
      const link = parseBookingLink(output);
      return link && <NextStepCard link={link} />;
    }
    case "tool-get_page_link": {
      const page = parsePageLink(output);
      return page && <PageCard page={page} />;
    }
    case "tool-show_contact_form": {
      const form = parseContactForm(output);
      return (
        form && (
          <ContactFormCard
            id={`cf-${part.toolCallId}`}
            reason={form.reason}
            submitted={ctx.contactSubmitted}
            disabled={ctx.busy}
            onSubmit={ctx.onContactSubmit}
          />
        )
      );
    }
    case "tool-request_human_followup": {
      const result = parseHandoff(output);
      return result && <HandoffCard result={result} />;
    }
    default:
      return null;
  }
}
