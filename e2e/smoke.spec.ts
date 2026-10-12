// G8: production smoke test. One real question against the deployed URL.
import { expect, test } from "@playwright/test";

test("production answers a basic question", async ({ page }) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Message the Cadre AI assistant" });
  await input.fill("What does Cadre AI do?");
  await input.press("Enter");

  const reply = page.getByTestId("assistant-message").last();
  await expect(reply).toContainText(/strategy|agent|engineering/i, { timeout: 30_000 });
  await expect(page.getByText(/couldn't answer just now/i)).toHaveCount(0);
  await expect(page.getByTestId("chat-error")).toHaveCount(0);
});
