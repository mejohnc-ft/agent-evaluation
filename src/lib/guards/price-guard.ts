import type { StreamTextTransform, TextStreamPart, ToolSet } from "ai";

// Runtime price guard (docs/guards.md). Cadre publishes no prices (D3), so any currency amount the
// model writes is invented unless the knowledge base states it verbatim (published results such as
// "$420,000 Saved Annually"). Invented amounts are replaced before the visitor sees them.
export const PRICE_REDACTION = "[pricing isn't published]";

const AMOUNT =
  /[$€£]\s?\d[\d,]*(?:\.\d+)?(?:\s?(?:k|K|m|M|bn|million|thousand|billion)\b)?|\b\d[\d,]*(?:\.\d+)?\s?(?:USD|EUR|GBP|dollars|euros|pounds)\b/g;
const MAX_HOLD = 4000;

export function publishedAmounts(knowledgeText: string): Set<string> {
  return new Set(knowledgeText.match(AMOUNT) ?? []);
}

export function redactPrices(text: string, allowed: Set<string>): { text: string; count: number } {
  let count = 0;
  const out = text.replace(AMOUNT, (amount) => {
    if (allowed.has(amount)) return amount;
    count++;
    return PRICE_REDACTION;
  });
  return { text: out, count };
}

// An amount and its unit can span a chunk boundary ("$2" + "5,000", "25,000 " + "dollars"), so the
// last two whitespace-separated tokens are held until more text arrives.
function safeLength(buffer: string): number {
  const gaps = [...buffer.matchAll(/\s+/g)];
  if (gaps.length < 2) return buffer.length > MAX_HOLD ? buffer.length : 0;
  const gap = gaps[gaps.length - 2];
  return gap.index + gap[0].length;
}

// For streamText's experimental_transform. Only text-delta parts change; all others pass through.
// onRedact receives the total number of amounts replaced, once, when the stream ends.
export function redactPricesTransform<TOOLS extends ToolSet>(
  allowed: Set<string>,
  onRedact: (count: number) => void,
): StreamTextTransform<TOOLS> {
  return () => {
    const buffers = new Map<string, string>();
    let redacted = 0;
    type Controller = TransformStreamDefaultController<TextStreamPart<TOOLS>>;
    const emit = (controller: Controller, id: string, raw: string) => {
      const { text, count } = redactPrices(raw, allowed);
      redacted += count;
      if (text) controller.enqueue({ type: "text-delta", id, text });
    };

    return new TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>({
      transform(part, controller) {
        if (part.type === "text-delta") {
          const buffer = (buffers.get(part.id) ?? "") + part.text;
          const cut = safeLength(buffer);
          buffers.set(part.id, buffer.slice(cut));
          emit(controller, part.id, buffer.slice(0, cut));
          return;
        }
        if (part.type === "text-end") {
          emit(controller, part.id, buffers.get(part.id) ?? "");
          buffers.delete(part.id);
        }
        controller.enqueue(part);
      },
      flush(controller) {
        for (const [id, rest] of buffers) emit(controller, id, rest);
        if (redacted) onRedact(redacted);
      },
    });
  };
}
