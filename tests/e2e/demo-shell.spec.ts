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
  await expect(page.getByLabel("Selected text")).toContainText("你好");
});

test("updates the selection debug preview", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Anchor offset").fill("3");
  await page.getByLabel("Focus offset").fill("11");

  await expect(page.getByLabel("Selected text")).toContainText("crucialy");
  await expect(page.getByLabel("Selection JSON")).toContainText('"offset": 11');
});

test("renders the model document in the editor preview", async ({ page }) => {
  await page.goto("/");

  const renderedDocument = page.getByLabel("Rendered document");

  await expect(renderedDocument).toContainText("你好，crucialy-rich。");
  await expect(renderedDocument.locator('[data-crucialy-path="[0,0]"]')).toContainText(
    "你好，crucialy-rich。",
  );
  await expect(renderedDocument.locator('[data-crucialy-path="[1,0]"]')).toContainText(
    "选区模型已就绪。",
  );
});

test("shows controlled and uncontrolled editor examples", async ({ page }) => {
  await page.goto("/");

  const controlledEditor = page.getByRole("textbox", {
    exact: true,
    name: "Controlled editor",
  });
  const uncontrolledEditor = page.getByRole("textbox", {
    exact: true,
    name: "Uncontrolled editor",
  });

  await expect(controlledEditor).toContainText("你好，crucialy-rich。");
  await expect(uncontrolledEditor).toContainText("非受控初始文档。");

  await page.getByLabel("Model example").selectOption("empty");

  await expect(controlledEditor).not.toContainText("你好，crucialy-rich。");
  await expect(uncontrolledEditor).toContainText("非受控初始文档。");
});

test("renders boundary examples without selection errors", async ({ page }) => {
  await page.goto("/");

  const emptyDocument = page.getByRole("textbox", {
    exact: true,
    name: "Empty document boundary",
  });
  const emptyParagraph = page.getByRole("textbox", {
    exact: true,
    name: "Empty paragraph boundary",
  });
  const multiParagraph = page.getByRole("textbox", {
    exact: true,
    name: "Multiple paragraph boundary",
  });

  await expect(emptyDocument).toHaveAttribute("data-crucialy-path", "[]");
  await expect(emptyDocument.locator("p")).toHaveCount(0);
  await expect(emptyParagraph.locator('[data-crucialy-path="[0]"]')).toHaveCount(1);
  await expect(emptyParagraph.locator('[data-crucialy-path="[0,0]"]')).toHaveCount(0);
  await expect(multiParagraph).toContainText("边界第一段。");
  await expect(multiParagraph).toContainText("边界第三段。");
  await expect(multiParagraph.locator('[data-crucialy-path="[2,0]"]')).toContainText(
    "边界第三段。",
  );
  await expect(page.getByLabel("Selection debugger")).toBeVisible();
});

test("syncs browser selection back to model selection", async ({ page }) => {
  await page.goto("/");

  await page
    .getByLabel("Rendered document")
    .locator('[data-crucialy-path="[0,0]"]')
    .evaluate((element) => {
      const text = element.firstChild;
      const range = document.createRange();
      const selection = window.getSelection();
      const renderedDocument = element.closest('[aria-label="Rendered document"]');

      if (!text || !selection || !renderedDocument) {
        throw new Error("Missing rendered text selection target.");
      }

      range.setStart(text, 3);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      renderedDocument.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });

  await expect(page.getByLabel("Selection JSON")).toContainText('"offset": 3');
  await expect(page.getByLabel("Selected text")).toContainText("(empty)");
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
  await expect(page.getByLabel("Document JSON", { exact: true })).toContainText(
    '"type": "paragraph"',
  );
});

test("highlights the selected document json node", async ({ page }) => {
  await page.goto("/");

  const highlightedLines = page.locator('.json-line[data-selected="true"]');

  await expect(
    highlightedLines.filter({ hasText: "你好，crucialy-rich。" }),
  ).toBeVisible();

  await page.getByLabel("Anchor path").fill("1,0");

  await expect(highlightedLines.filter({ hasText: "选区模型已就绪。" })).toBeVisible();
});
