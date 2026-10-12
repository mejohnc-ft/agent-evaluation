import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  retries: 1,
  use: { baseURL: process.env.SMOKE_URL ?? "https://agent-evaluation-five.vercel.app" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
