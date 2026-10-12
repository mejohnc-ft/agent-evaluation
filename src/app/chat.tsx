"use client";

import { useChat } from "@ai-sdk/react";
import { contactFormMessage, type ContactFormFields } from "@/lib/tools/ui-types";
import { ChatError } from "./components/chat-error";
import { Composer } from "./components/composer";
import { EmptyState } from "./components/empty-state";
import { MessageList } from "./components/message-list";
import { messageText } from "./components/message-text";
import { SiteHeader } from "./components/site-header";
import { useStickToBottom } from "./components/use-stick-to-bottom";

export function Chat() {
  const { messages, sendMessage, regenerate, status, error } = useChat();
  const { contentRef, pin } = useStickToBottom<HTMLDivElement>();
  const busy = status === "submitted" || status === "streaming";
  const last = messages.at(-1);
  // Announce each finished reply once, rather than every streamed token.
  const announcement = status === "ready" && last?.role === "assistant" ? messageText(last) : "";

  function send(text: string) {
    sendMessage({ text });
    pin();
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-[42rem] flex-1 px-5">
        <div ref={contentRef}>
          {messages.length === 0 ? (
            <EmptyState onPick={send} disabled={busy} />
          ) : (
            <>
              <h1 className="sr-only">Conversation with the Cadre AI assistant</h1>
              <MessageList
                messages={messages}
                status={status}
                onContactSubmit={(fields: ContactFormFields) => send(contactFormMessage(fields))}
              />
            </>
          )}
          {error && (
            <div className="pb-6">
              <ChatError onRetry={() => regenerate()} />
            </div>
          )}
        </div>
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </div>
      </main>
      <footer className="sticky bottom-0 z-10 bg-gradient-to-t from-surface from-70% to-transparent pt-6">
        <div className="mx-auto w-full max-w-[42rem] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
          <Composer onSend={send} busy={busy} />
          <p id="composer-help" className="mt-2.5 px-2 text-center text-xs leading-relaxed text-muted">
            You&apos;re chatting with an AI assistant. Details you share for a follow-up go to the Cadre team.{" "}
            <a
              href="https://cadre.ai/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-hairline-strong underline-offset-2 hover:text-ink hover:decoration-ink"
            >
              Privacy policy
            </a>
          </p>
        </div>
      </footer>
    </>
  );
}
