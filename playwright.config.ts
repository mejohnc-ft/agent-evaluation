import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  retries: 1,
  use: {
    baseURL: process.env.SMOKE_URL ?? "https://agent-evaluation-five.vercel.app",
    // Lets the headless run past the bot check only (D16); rate limit and spend breaker still apply.
    extraHTTPHeaders: process.env.SMOKE_TOKEN ? { "x-smoke-token": process.env.SMOKE_TOKEN } : {},
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
