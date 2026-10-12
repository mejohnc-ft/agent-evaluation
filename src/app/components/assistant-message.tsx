import type { UIMessage } from "ai";
import { Markdown } from "./markdown";
import { ToolCard, type ToolCardContext } from "./tool-card";
import { TypingIndicator } from "./typing-indicator";

// Prose first, then cards: replies refer to "the button below", and tool calls often stream
// before the text that introduces them.
export function AssistantMessage({
  message,
  streaming,
  ctx,
}: {
  message: UIMessage;
  streaming: boolean;
  ctx: ToolCardContext;
}) {
  const texts = message.parts.flatMap((p, i) => (p.type === "text" && p.text.trim() ? [{ i, text: p.text }] : []));
  const tools = message.parts.flatMap((p, i) => (p.type.startsWith("tool-") ? [{ i, part: p }] : []));
  const waiting = streaming && (texts.length === 0 || message.parts.at(-1)?.type !== "text");

  return (
    <div className="flex animate-rise flex-col gap-4" data-testid="assistant-message">
      {texts.map(({ i, text }) => (
        <Markdown key={i} text={text} />
      ))}
      {waiting && <TypingIndicator />}
      {tools.map(({ i, part }) => (
        <ToolCard key={i} part={part} ctx={ctx} />
      ))}
    </div>
  );
}
