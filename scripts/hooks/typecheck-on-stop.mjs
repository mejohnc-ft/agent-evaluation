// G9: Stop hook. Claude may not finish while the project has type errors.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const { stop_hook_active: alreadyBlocked } = JSON.parse(readFileSync(0, "utf8"));
if (alreadyBlocked) process.exit(0);

try {
  execFileSync("npm", ["run", "--silent", "typecheck"], { stdio: "pipe" });
} catch (error) {
  console.error(`G9: typecheck failed. Fix these before stopping:\n${error.stdout}${error.stderr}`);
  process.exit(2);
}
