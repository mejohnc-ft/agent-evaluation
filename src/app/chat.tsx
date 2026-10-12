"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { useState } from "react";

type Part = UIMessage["parts"][number];
type LinkOutput = { url: string; cta: string };
type FollowupOutput = { ok: boolean };

// Tool results arrive over the stream; render only the shapes we expect.
function ToolResult({ part }: { part: Part }) {
  if (!("state" in part) || part.state !== "output-available") return null;
  if (part.type === "tool-get_booking_link") {
    const { url, cta } = part.output as LinkOutput;
    if (!url?.startsWith("https://")) return null;
    return (
      <a className="inline-block rounded bg-zinc-900 px-3 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900" href={url} target="_blank" rel="noopener noreferrer">
        {cta}
      </a>
    );
  }
  // Confirm a handoff only after the server says the row was written.
  if (part.type === "tool-request_human_followup" && (part.output as FollowupOutput).ok) {
    return <p className="text-sm text-green-700">Request sent to the Cadre team.</p>;
  }
  return null;
}

export function Chat() {
  const { messages, sendMessage, status, error } = useChat();
  const [input, setInput] = useState("");
  const busy = status === "submitted" || status === "streaming";

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">Cadre AI assistant</h1>
      <div className="flex flex-1 flex-col gap-3">
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "self-end" : "flex flex-col gap-2"}>
            <p className={m.role === "user" ? "rounded bg-zinc-100 px-3 py-2 dark:bg-zinc-800" : "whitespace-pre-wrap"}>
              {m.parts.map((p) => (p.type === "text" ? p.text : "")).join("")}
            </p>
            {m.parts.map((p, i) => (
              <ToolResult key={i} part={p} />
            ))}
          </div>
        ))}
        {error && <p className="text-red-600">Sorry, something went wrong. Please try again, or email hello@gocadre.ai.</p>}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim()) return;
          sendMessage({ text: input });
          setInput("");
        }}
      >
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="Ask about Cadre AI…"
          value={input}
          maxLength={2000}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
        />
        <p className="mt-2 text-xs text-zinc-500">
          You&apos;re chatting with an AI assistant. Details you share for a follow-up go to the Cadre team. See the{" "}
          <a className="underline" href="https://cadre.ai/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
            privacy policy
          </a>
          .
        </p>
      </form>
    </main>
  );
}
