import type { UIMessage } from "ai";
import { Check } from "./icons";
import { contactSummary, isContactSubmission, messageText } from "./message-text";

export function UserMessage({ message }: { message: UIMessage }) {
  const text = messageText(message);

  if (isContactSubmission(message)) {
    const { name, email } = contactSummary(text);
    return (
      <div className="flex animate-rise justify-end" data-testid="user-message">
        <div className="flex max-w-[85%] items-center gap-2.5 rounded-full border border-hairline bg-surface py-1.5 pr-4 pl-1.5 text-sm">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-bubble text-ink">
            <Check className="size-3.5" />
          </span>
          <span className="min-w-0">
            <span className="font-medium text-ink">Contact details shared</span>
            <span className="block truncate text-xs text-muted">
              {name} · {email}
            </span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex animate-rise justify-end" data-testid="user-message">
      <p className="max-w-[85%] rounded-[1.25rem] rounded-br-md bg-bubble px-4 py-2.5 text-base leading-relaxed whitespace-pre-wrap text-ink [overflow-wrap:anywhere]">
        {text}
      </p>
    </div>
  );
}
