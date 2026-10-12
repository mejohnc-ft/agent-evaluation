import type { TextStreamPart, ToolSet } from "ai";
import { describe, expect, it } from "vitest";
import { stripLinks, stripLinksTransform } from "./link-filter";

type Part = TextStreamPart<ToolSet>;

async function run(parts: Part[]): Promise<Part[]> {
  const transform = stripLinksTransform<ToolSet>()({ tools: {}, stopStream: () => {} });
  const out: Part[] = [];
  const reader = new ReadableStream<Part>({
    start(controller) {
      parts.forEach((p) => controller.enqueue(p));
      controller.close();
    },
  })
    .pipeThrough(transform)
    .getReader();
  for (let r = await reader.read(); !r.done; r = await reader.read()) out.push(r.value);
  return out;
}

const deltas = (id: string, chunks: string[]): Part[] => chunks.map((text) => ({ type: "text-delta", id, text }));
const textOf = (parts: Part[]) => parts.map((p) => (p.type === "text-delta" ? p.text : "")).join("");

describe("stripLinks", () => {
  it.each([
    ["https URL", "Book here: https://cadre.ai/book-a-call today", "cadre.ai"],
    ["http URL", "See http://example.com/x?y=1 for more", "example.com"],
    ["www. host", "Go to www.cadre.ai/services now", "www."],
    ["bare domain with path", "Visit cadre.ai/services for detail", "cadre.ai"],
    ["bare subdomain", "Take it at portal.gocadre.ai today", "gocadre"],
  ])("removes a %s", (_, input, leaked) => {
    const out = stripLinks(input);
    expect(out).not.toContain(leaked);
    expect(out).not.toMatch(/https?:/);
  });

  it("keeps the words around a removed URL", () => {
    expect(stripLinks("Book here: https://cadre.ai/book today")).toMatch(/^Book here: +today$/);
  });

  it("keeps trailing sentence punctuation", () => {
    expect(stripLinks("More at https://cadre.ai/faq.")).toBe("More at .");
  });

  it("keeps the text of a markdown link", () => {
    expect(stripLinks("Please [book a call](https://cadre.ai/book) with us.")).toBe("Please book a call with us.");
  });

  it("keeps the alt text of a markdown image", () => {
    expect(stripLinks("![Cadre logo](https://cadre.ai/logo.png)")).toBe("Cadre logo");
  });

  it.each(["hello@gocadre.ai", "privacy@gocadre.ai", "first.last@cadre.ai", "john.co@acme.com"])(
    "leaves the email %s intact",
    (email) => {
      expect(stripLinks(`Email ${email} for help.`)).toBe(`Email ${email} for help.`);
    },
  );

  it("leaves text without links unchanged", () => {
    const text = "Cadre helps mid-market teams adopt AI. e.g. Node.js and 3.5 are fine.";
    expect(stripLinks(text)).toBe(text);
  });
});

describe("stripLinksTransform", () => {
  it("removes a URL split across deltas", async () => {
    const out = await run([...deltas("t", ["Visit https://ca", "dre.ai/bo", "ok now"]), { type: "text-end", id: "t" }]);
    expect(textOf(out)).not.toContain("dre.ai");
    expect(textOf(out)).toBe(stripLinks("Visit https://cadre.ai/book now"));
  });

  it("keeps the text of a markdown link split across deltas", async () => {
    const chunks = ["Please [book ", "a call](https://", "cadre.ai/book) with us."];
    const out = await run([...deltas("t", chunks), { type: "text-end", id: "t" }]);
    expect(textOf(out)).toBe("Please book a call with us.");
  });

  it("keeps an email split across deltas", async () => {
    const out = await run([...deltas("t", ["Email hello@go", "cadre.ai today"]), { type: "text-end", id: "t" }]);
    expect(textOf(out)).toBe("Email hello@gocadre.ai today");
  });

  it("flushes buffered text before text-end", async () => {
    const out = await run([...deltas("t", ["Hello there"]), { type: "text-end", id: "t" }]);
    expect(out.at(-1)).toEqual({ type: "text-end", id: "t" });
    expect(textOf(out)).toBe("Hello there");
  });

  it("flushes remaining text when the stream ends without text-end", async () => {
    const out = await run(deltas("t", ["no trailing space at https://cadre.ai"]));
    expect(textOf(out)).toBe(stripLinks("no trailing space at https://cadre.ai"));
  });

  it("passes every non-text part through unchanged", async () => {
    const reasoning: Part = { type: "reasoning-delta", id: "r", text: "https://cadre.ai" };
    const start: Part = { type: "start" };
    const end: Part = { type: "text-end", id: "t" };
    const out = await run([start, reasoning, end]);
    expect(out).toEqual([start, reasoning, end]);
    expect(out[1]).toBe(reasoning);
  });

  it("matches stripLinks for any chunking of the same text", async () => {
    const text = "Try [the index](https://portal.gocadre.ai/x) or www.cadre.ai, or email hello@gocadre.ai. Thanks!";
    for (const size of [1, 2, 3, 7, 13]) {
      const chunks = text.match(new RegExp(`[\\s\\S]{1,${size}}`, "g"))!;
      const out = await run([...deltas("t", chunks), { type: "text-end", id: "t" }]);
      expect(textOf(out)).toBe(stripLinks(text));
    }
  });
});
