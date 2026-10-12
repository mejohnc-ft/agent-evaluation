import { readKnowledge } from "./prompt/build";

let cached: Map<string, string> | undefined;

// One line describing a cadre.ai page, from the knowledge file whose `source:` is that page: its
// `summary:` frontmatter when present, otherwise the first sentence of the body. Only knowledge-base
// words reach the card.
export function pageSummary(url: string): string {
  cached ??= new Map(
    readKnowledge().flatMap(({ text }) => {
      const source = text.match(/^source:\s*(\S+)/m)?.[1];
      const body = text.split(/^# .*$/m)[1] ?? "";
      const summary = text.match(/^summary:\s*(.+)$/m)?.[1];
      const line = summary ?? body.split("\n").map((l) => l.replace(/^- /, "").trim()).find(Boolean);
      return source && line ? [[source, firstSentence(line)] as const] : [];
    }),
  );
  return cached.get(url) ?? "";
}

function firstSentence(line: string): string {
  const text = line.replace(/^Cadre's .+? page says:\s*/i, "");
  const sentence = text.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? text;
  return sentence.length > 160 ? `${sentence.slice(0, 157).trimEnd()}…` : sentence;
}
