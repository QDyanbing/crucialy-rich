import { expect, test } from "@playwright/test";

test("renders the demo shell", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "crucialy-rich" }),
  ).toBeVisible();
  await expect(page.getByLabel("Editor preview")).toBeVisible();
  await expect(page.getByLabel("Document debug panel")).toContainText(
    '"type": "document"',
  );
});

