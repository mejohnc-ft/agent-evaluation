import type { StreamTextTransform, TextStreamPart, ToolSet } from "ai";

// The model never writes URLs in text; links come only from tool results (docs/guards.md).
const MARKDOWN_LINK = /!?\[([^\]]*)\]\([^)\s]*\)/g;
const URL = /(?:https?:\/\/|www\.)[^\s<>()[\]]+/gi;
// Bare domains, same TLDs as the eval no_url check. Not after @ or before @, so emails survive.
const BARE_DOMAIN =
  /(?<![@\w.-])(?:[a-z0-9-]+\.)+(?:ai|com|io|net|org|co|dev|app)\b(?![@\w-]|\.[\w-])(?:\/[^\s<>()[\]]*)?/gi;
const TRAILING_PUNCTUATION = /[.,;:!?'"]+$/;
// A complete markdown link, or a bracket that is closed and not followed by "(".
const SETTLED_BRACKET = /^!?\[[^\]]*\](?:\([^)\s]*\)|[^(])/;
const MAX_HOLD = 4000;

const keepPunctuation = (match: string) => match.match(TRAILING_PUNCTUATION)?.[0] ?? "";

export function stripLinks(text: string): string {
  return text.replace(MARKDOWN_LINK, "$1").replace(URL, keepPunctuation).replace(BARE_DOMAIN, keepPunctuation);
}

// How much of the buffer is safe to filter now: up to the last whitespace, but never through the
// middle of a markdown link, since a URL or link can continue in the next delta.
function safeLength(buffer: string): number {
  const cut = buffer.search(/\s\S*$/) + 1;
  if (buffer.length - cut > MAX_HOLD) return buffer.length;
  const open = buffer.lastIndexOf("[", cut - 1);
  if (open < 0 || buffer.length - open > MAX_HOLD) return cut;
  const settled = buffer.slice(open).match(SETTLED_BRACKET);
  if (settled && open + settled[0].length <= cut) return cut;
  return buffer[open - 1] === "!" ? open - 1 : open;
}

// For streamText's experimental_transform. Only text-delta parts change; all others pass through.
export function stripLinksTransform<TOOLS extends ToolSet>(): StreamTextTransform<TOOLS> {
  return () => {
    const buffers = new Map<string, string>();
    type Controller = TransformStreamDefaultController<TextStreamPart<TOOLS>>;
    const flushId = (controller: Controller, id: string) => {
      const text = stripLinks(buffers.get(id) ?? "");
      buffers.delete(id);
      if (text) controller.enqueue({ type: "text-delta", id, text });
    };

    return new TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>({
      transform(part, controller) {
        if (part.type === "text-delta") {
          const buffer = (buffers.get(part.id) ?? "") + part.text;
          const cut = safeLength(buffer);
          buffers.set(part.id, buffer.slice(cut));
          const text = stripLinks(buffer.slice(0, cut));
          if (text) controller.enqueue({ ...part, text });
          return;
        }
        if (part.type === "text-end") flushId(controller, part.id);
        controller.enqueue(part);
      },
      flush(controller) {
        for (const id of [...buffers.keys()]) flushId(controller, id);
      },
    });
  };
}
