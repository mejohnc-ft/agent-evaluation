// G2: PreToolUse hook. Blocks Claude from reading or editing .env files (except .env.example).
import { readFileSync } from "node:fs";

const { tool_input: input = {} } = JSON.parse(readFileSync(0, "utf8"));
const targets = [input.file_path, input.path, input.command].filter(Boolean).join(" ");
const touchesEnv = /(^|[\s/'"=])\.env(?!\.example)(\.[\w.-]+)?(?=$|[\s'";|&)])/.test(targets);

if (touchesEnv) {
  console.error("Blocked by G2: .env files hold secrets. Refer to env vars by name; ask the user to set values.");
  process.exit(2);
}
