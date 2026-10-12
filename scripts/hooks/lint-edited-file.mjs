// G9: PostToolUse hook. Lints the file Claude just edited and feeds errors back.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const { tool_input: input = {} } = JSON.parse(readFileSync(0, "utf8"));
const file = input.file_path ?? "";
if (!/\.(ts|tsx|mjs|js)$/.test(file) || file.includes("node_modules")) process.exit(0);

try {
  execFileSync("npx", ["eslint", "--no-warn-ignored", file], { stdio: "pipe" });
} catch (error) {
  console.error(`G9 lint errors in ${file}:\n${error.stdout}${error.stderr}`);
  process.exit(2);
}
