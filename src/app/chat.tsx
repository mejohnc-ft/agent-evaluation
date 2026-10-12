"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { contactFormMessage, type ContactFormFields } from "@/lib/tools/ui-types";
import { ChatError } from "./components/chat-error";
import { Composer } from "./components/composer";
import { EmptyState } from "./components/empty-state";
import { MessageList } from "./components/message-list";
import { messageText } from "./components/message-text";
import { releasePanelFocus, SidePanel } from "./components/side-panel";
import { SiteHeader } from "./components/site-header";
import { useStickToBottom } from "./components/use-stick-to-bottom";

// With the panel open on desktop, the page reserves its 22rem column and the chat centres in the rest.
const SHIFT = "transition-[padding] duration-300 ease-out-expo";

export function Chat() {
  // A new id makes useChat start a fresh, empty Chat; the id is sent as the conversation id.
  const [chatId, setChatId] = useState<string>();
  const [panelOpen, setPanelOpen] = useState(false);
  const { messages, sendMessage, regenerate, status, error } = useChat({ id: chatId });
  const { contentRef, pin } = useStickToBottom<HTMLDivElement>();
  const busy = status === "submitted" || status === "streaming";
  const last = messages.at(-1);
  // Announce each finished reply once, rather than every streamed token.
  const announcement = status === "ready" && last?.role === "assistant" ? messageText(last) : "";
  const reserve = panelOpen ? "lg:pr-[22rem]" : "";

  function send(text: string) {
    sendMessage({ text });
    pin();
  }

  function newChat() {
    setChatId(crypto.randomUUID());
    window.scrollTo({ top: 0 });
  }

  function togglePanel() {
    if (panelOpen) releasePanelFocus();
    setPanelOpen(!panelOpen);
  }

  return (
    <>
      <SiteHeader onNewChat={newChat} newChatDisabled={busy} panelOpen={panelOpen} onTogglePanel={togglePanel} />
      <main className={`w-full flex-1 ${SHIFT} ${reserve}`}>
        <div className="gutter">
          <div ref={contentRef} className="mx-auto max-w-[42rem]">
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
        </div>
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </div>
      </main>
      <div className="sticky bottom-0 z-10">
        <SidePanel open={panelOpen} onClose={() => setPanelOpen(false)} messages={messages} />
        <footer
          className={`${SHIFT} ${reserve} ${panelOpen ? "max-lg:bg-surface max-lg:pt-3" : "bg-gradient-to-t from-surface from-70% to-transparent pt-6"} lg:bg-gradient-to-t lg:from-surface lg:from-70% lg:to-transparent lg:pt-6`}
        >
          <div className="gutter mx-auto box-content max-w-[42rem] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Composer onSend={send} busy={busy} />
            <p id="composer-help" className="mt-3 px-2 text-center text-caption text-muted">
              You&apos;re chatting with an AI assistant. Details you share for a follow-up go to the Cadre team.{" "}
              <a
                href="https://cadre.ai/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="hit-44 underline decoration-hairline-strong underline-offset-2 hover:text-ink hover:decoration-ink"
              >
                Privacy policy
              </a>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
