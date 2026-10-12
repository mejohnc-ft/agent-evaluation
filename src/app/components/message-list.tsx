import type { UIMessage } from "ai";
import type { ContactFormFields } from "@/lib/tools/ui-types";
import { AssistantMessage } from "./assistant-message";
import { isContactSubmission, lastTypedEmail } from "./message-text";
import { TypingIndicator } from "./typing-indicator";
import { UserMessage } from "./user-message";

type Props = {
  messages: UIMessage[];
  status: "submitted" | "streaming" | "ready" | "error";
  onContactSubmit: (fields: ContactFormFields) => void;
};

export function MessageList({ messages, status, onContactSubmit }: Props) {
  const busy = status === "submitted" || status === "streaming";
  const last = messages.at(-1);

  return (
    <ol className="flex flex-col gap-8 pt-8 pb-10" aria-label="Conversation">
      {messages.map((message, i) => (
        <li key={message.id}>
          {message.role === "user" ? (
            <UserMessage message={message} />
          ) : (
            <AssistantMessage
              message={message}
              streaming={status === "streaming" && message === last}
              ctx={{
                busy,
                onContactSubmit,
                contactSubmitted: messages.slice(i + 1).some(isContactSubmission),
                prefillEmail: lastTypedEmail(messages.slice(0, i)),
              }}
            />
          )}
        </li>
      ))}
      {status === "submitted" && last?.role === "user" && (
        <li>
          <TypingIndicator />
        </li>
      )}
    </ol>
  );
}
