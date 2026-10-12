import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";

export type KnowledgeSource = { file: string; title: string; url: string; verified: string };

// Frontmatter `source:` and `verified:`, plus the first "# " heading. Files missing any of the
// three are skipped (check:kb enforces them, so this only guards against a stray file).
export function parseSource(file: string, text: string): KnowledgeSource | null {
  const front = /^---\n([\s\S]*?)\n---/.exec(text)?.[1];
  if (!front) return null;
  const field = (name: string) => new RegExp(`^${name}:\\s*(.+?)\\s*$`, "m").exec(front)?.[1];
  const url = field("source");
  const verified = field("verified");
  const title = /^# (.+?)\s*$/m.exec(text.slice(front.length))?.[1];
  // Headings carry a "(industry)" qualifier for the model; visitors see the page name.
  return url && verified && title ? { file, title: title.replace(/\s*\(industry\)$/, ""), url, verified } : null;
}

// Knowledge only changes with a deploy, so the list is built once and cached for the long term.
export async function knowledgeSources(): Promise<KnowledgeSource[]> {
  "use cache";
  cacheLife("max");
  const dir = path.join(process.cwd(), "knowledge");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".md") && f !== "links.md").sort();
  const sources = await Promise.all(
    files.map(async (file) => parseSource(file, await readFile(path.join(dir, file), "utf8"))),
  );
  return sources.filter((s) => s !== null).sort((a, b) => a.title.localeCompare(b.title));
}
