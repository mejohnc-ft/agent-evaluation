// G3: knowledge schema. Every topic file has source/verified frontmatter on an allowed host,
// an evidence file, and no unresolved markers; every links.md entry is https on an allowed host.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import yaml from "js-yaml";
import { isAllowedUrl } from "../src/lib/allowed-hosts";

const DIR = "knowledge";
const UNRESOLVED = /\b(CONFLICT|TODO):/;
const errors: string[] = [];

for (const file of readdirSync(DIR).filter((f) => f.endsWith(".md") && f !== "links.md")) {
  const text = readFileSync(`${DIR}/${file}`, "utf8");
  const front = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!front) {
    errors.push(`${file}: missing frontmatter`);
    continue;
  }
  const meta = (yaml.load(front[1], { schema: yaml.JSON_SCHEMA }) ?? {}) as Record<string, unknown>;
  if (typeof meta.source !== "string" || !isAllowedUrl(meta.source)) errors.push(`${file}: source must be an https URL on an allowed host`);
  if (typeof meta.verified !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(meta.verified)) errors.push(`${file}: verified must be YYYY-MM-DD`);
  if (!existsSync(`${DIR}/_evidence/${file.replace(/\.md$/, ".json")}`)) errors.push(`${file}: no _evidence file`);
  const marker = text.match(UNRESOLVED);
  if (marker) errors.push(`${file}: unresolved ${marker[1]}: marker`);
}

const links = readFileSync(`${DIR}/links.md`, "utf8").match(/https?:\/\/[^\s)>\]]+/g) ?? [];
if (!links.length) errors.push("links.md: no links");
for (const url of links) if (!isAllowedUrl(url)) errors.push(`links.md: ${url} is not https on an allowed host`);

if (errors.length) {
  console.error(`check:kb failed (G3)\n${errors.map((e) => `  - ${e}`).join("\n")}`);
  process.exit(1);
}
console.log(`check:kb ok: ${links.length} links, knowledge schema valid`);
