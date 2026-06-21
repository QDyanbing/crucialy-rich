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
  await expect(page.getByLabel("Selection debugger")).toBeVisible();
  await expect(page.getByLabel("Selected text")).toContainText("Hello");
});

test("updates the selection debug preview", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Anchor offset").fill("6");
  await page.getByLabel("Focus offset").fill("14");

  await expect(page.getByLabel("Selected text")).toContainText("crucialy");
  await expect(page.getByLabel("Selection JSON")).toContainText('"offset": 14');
});
