"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";

export function Chat() {
  const { messages, sendMessage, status, error } = useChat();
  const [input, setInput] = useState("");
  const busy = status === "submitted" || status === "streaming";

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">Cadre AI assistant</h1>
      <div className="flex flex-1 flex-col gap-3">
        {messages.map((m) => (
          <p key={m.id} className={m.role === "user" ? "self-end rounded bg-zinc-100 px-3 py-2 dark:bg-zinc-800" : ""}>
            {m.parts.map((p) => (p.type === "text" ? p.text : "")).join("")}
          </p>
        ))}
        {error && <p className="text-red-600">{error.message}</p>}
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
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
        />
      </form>
    </main>
  );
}
