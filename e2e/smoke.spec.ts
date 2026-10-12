// G8: production smoke test. One real question against the deployed URL.
import { expect, test } from "@playwright/test";

test("production answers a basic question", async ({ page }) => {
  await page.goto("/");
  const input = page.getByPlaceholder("Ask about Cadre AI…");
  await input.fill("What does Cadre AI do?");
  await input.press("Enter");

  const reply = page.locator("main p").nth(1);
  await expect(reply).toContainText(/strategy|agent|engineering/i, { timeout: 30_000 });
  await expect(page.getByText(/couldn't answer just now/i)).toHaveCount(0);
  await expect(page.locator(".text-red-600")).toHaveCount(0);
});
