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

test("normalizes invalid model examples", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Model example").selectOption("invalid");

  await expect(page.getByLabel("Model validation status")).toContainText("Invalid");
  await expect(page.getByLabel("Model validation errors")).toContainText(
    "document child must be a block node",
  );

  await page.getByRole("button", { name: "Normalize" }).click();

  await expect(page.getByLabel("Model validation status")).toContainText("Valid");
  await expect(page.getByLabel("Document JSON")).toContainText('"type": "paragraph"');
});
