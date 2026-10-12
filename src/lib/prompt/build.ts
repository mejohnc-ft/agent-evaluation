import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const KNOWLEDGE_DIR = path.join(process.cwd(), "knowledge");
const SYSTEM_PATH = path.join(process.cwd(), "src/lib/prompt/system.md");
// links.md feeds the link tools (Phase 2); the model never sees URLs.
const NOT_IN_PROMPT = new Set(["links.md"]);

export function readKnowledge() {
  return readdirSync(KNOWLEDGE_DIR)
    .filter((file) => file.endsWith(".md") && !NOT_IN_PROMPT.has(file))
    .sort()
    .map((file) => ({ file, text: readFileSync(path.join(KNOWLEDGE_DIR, file), "utf8").trim() }));
}

let cached: { text: string; hash: string } | undefined;

// System rules plus every knowledge file, built once per process.
export function buildSystemPrompt() {
  if (cached) return cached;
  const knowledge = readKnowledge()
    .map((k) => `<knowledge file="${k.file}">\n${k.text}\n</knowledge>`)
    .join("\n\n");
  const text = `${readFileSync(SYSTEM_PATH, "utf8").trim()}\n\n# Knowledge base\n\n${knowledge}\n`;
  cached = { text, hash: createHash("sha256").update(text).digest("hex").slice(0, 12) };
  return cached;
}
