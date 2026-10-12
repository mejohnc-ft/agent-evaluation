import { readFileSync } from "node:fs";
import path from "node:path";
import { isAllowedUrl } from "./allowed-hosts";

const LINKS_PATH = path.join(process.cwd(), "knowledge/links.md");

let cached: Map<string, string> | undefined;

// "- Label: https://..." lines from knowledge/links.md, the only source of links the visitor sees.
function links() {
  cached ??= new Map(
    [...readFileSync(LINKS_PATH, "utf8").matchAll(/^- (.+?): (https:\/\/\S+)$/gm)].map((m) => [m[1], m[2]]),
  );
  return cached;
}

export function linkFor(label: string): { label: string; url: string } {
  const url = links().get(label);
  if (!url || !isAllowedUrl(url)) throw new Error(`links.md has no allowed link labelled "${label}"`);
  return { label, url };
}
