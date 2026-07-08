import { expect, test, type Page } from "@playwright/test";

async function placeCaretInRenderedText(page: Page, path: string, offset: number) {
  await page
    .getByLabel("已渲染文档")
    .locator(`[data-crucialy-path="${path}"]`)
    .evaluate((element, nextOffset) => {
      const text = element.firstChild;
      const range = document.createRange();
      const selection = window.getSelection();
      const renderedDocument = element.closest('[aria-label="已渲染文档"]');

      if (!selection || !(renderedDocument instanceof HTMLElement)) {
        throw new Error("Missing rendered text selection target.");
      }

      renderedDocument.focus();
      range.setStart(text ?? element, text ? nextOffset : 0);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      renderedDocument.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    }, offset);
}

test("renders the demo shell", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "crucialy-rich" }),
  ).toBeVisible();
  await expect(page.getByLabel("编辑器预览")).toBeVisible();
  await expect(page.getByLabel("文档调试面板")).toContainText('"type": "document"');
  await expect(page.getByLabel("选区调试器")).toBeVisible();
  await expect(page.getByLabel("选中文本")).toContainText("你好");
});

test("updates the selection debug preview", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("锚点偏移").fill("3");
  await page.getByLabel("焦点偏移").fill("11");

  await expect(page.getByLabel("选中文本")).toContainText("crucialy");
  await expect(page.getByLabel("选区 JSON")).toContainText('"offset": 11');
});

test("renders the model document in the editor preview", async ({ page }) => {
  await page.goto("/");

  const renderedDocument = page.getByLabel("已渲染文档");

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
    name: "受控编辑器",
  });
  const uncontrolledEditor = page.getByRole("textbox", {
    exact: true,
    name: "非受控编辑器",
  });

  await expect(controlledEditor).toContainText("你好，crucialy-rich。");
  await expect(uncontrolledEditor).toContainText("非受控初始文档。");

  await page.getByLabel("模型示例").selectOption("empty");

  await expect(controlledEditor).not.toContainText("你好，crucialy-rich。");
  await expect(uncontrolledEditor).toContainText("非受控初始文档。");
});

test("renders boundary examples without selection errors", async ({ page }) => {
  await page.goto("/");

  const emptyDocument = page.getByRole("textbox", {
    exact: true,
    name: "空文档边界",
  });
  const emptyParagraph = page.getByRole("textbox", {
    exact: true,
    name: "空段落边界",
  });
  const multiParagraph = page.getByRole("textbox", {
    exact: true,
    name: "多段落边界",
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
  await expect(page.getByLabel("选区调试器")).toBeVisible();
});

test("syncs browser selection back to model selection", async ({ page }) => {
  await page.goto("/");

  await page
    .getByLabel("已渲染文档")
    .locator('[data-crucialy-path="[0,0]"]')
    .evaluate((element) => {
      const text = element.firstChild;
      const range = document.createRange();
      const selection = window.getSelection();
      const renderedDocument = element.closest('[aria-label="已渲染文档"]');

      if (!text || !selection || !renderedDocument) {
        throw new Error("Missing rendered text selection target.");
      }

      range.setStart(text, 3);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      renderedDocument.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });

  await expect(page.getByLabel("选区 JSON")).toContainText('"offset": 3');
  await expect(page.getByLabel("选中文本")).toContainText("（空）");
});

test("normalizes invalid model examples", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("模型示例").selectOption("invalid");

  await expect(page.getByLabel("模型校验状态")).toContainText("非法");
  await expect(page.getByLabel("模型校验错误")).toContainText(
    "document 子节点必须是块级节点",
  );

  await page.getByRole("button", { name: "规范化" }).click();

  await expect(page.getByLabel("模型校验状态")).toContainText("合法");
  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"type": "paragraph"',
  );
});

test("applies insert text from the operation controls", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("插入文本").fill("新文本");
  await page.getByRole("button", { name: "插入" }).click();

  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"text": "新文本你好，crucialy-rich。"',
  );
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    '"operations"',
  );
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    '"type": "insert_text"',
  );
  await expect(page.getByLabel("最近 Transaction 验收报告")).toContainText(
    '"ok": true',
  );
  await expect(page.getByLabel("最近 Transaction 验收报告")).toContainText(
    '"operationTypes":',
  );
  await expect(page.getByLabel("最近 Transaction 验收报告")).toContainText(
    '"insert_text"',
  );
  await expect(page.getByLabel("选区 JSON")).toContainText('"offset": 3');
});

test("inserts text through beforeinput in the editor", async ({ page }) => {
  await page.goto("/");

  await placeCaretInRenderedText(page, "[0,0]", 3);
  await page.keyboard.type("真");

  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"text": "你好，真crucialy-rich。"',
  );
  await expect(page.getByLabel("选区 JSON")).toContainText('"offset": 4');
});

test("keeps the caret moving during consecutive beforeinput inserts", async ({
  page,
}) => {
  await page.goto("/");

  await placeCaretInRenderedText(page, "[0,0]", 3);
  await page.keyboard.type("输入");

  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"text": "你好，输入crucialy-rich。"',
  );
  await expect(page.getByLabel("选区 JSON")).toContainText('"offset": 5');
});

test("deletes the previous character with Backspace in the editor", async ({
  page,
}) => {
  await page.goto("/");

  await placeCaretInRenderedText(page, "[0,0]", 3);
  await page.keyboard.press("Backspace");

  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"text": "你好crucialy-rich。"',
  );
  await expect(page.getByLabel("选区 JSON")).toContainText('"offset": 2');
});

test("merges with the previous paragraph with Backspace in the editor", async ({
  page,
}) => {
  await page.goto("/");

  await placeCaretInRenderedText(page, "[1,0]", 0);
  await page.keyboard.press("Backspace");

  const renderedDocument = page.getByLabel("已渲染文档");

  await expect(renderedDocument.locator("p")).toHaveCount(1);
  await expect(renderedDocument).toContainText("你好，crucialy-rich。");
  await expect(renderedDocument).toContainText("选区模型已就绪。");
  await expect(page.getByLabel("选区 JSON")).toContainText('"offset": 17');
});

test("deletes the next character with Delete in the editor", async ({ page }) => {
  await page.goto("/");

  await placeCaretInRenderedText(page, "[0,0]", 2);
  await page.keyboard.press("Delete");

  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"text": "你好crucialy-rich。"',
  );
  await expect(page.getByLabel("选区 JSON")).toContainText('"offset": 2');
});

test("merges with the next paragraph with Delete in the editor", async ({ page }) => {
  await page.goto("/");

  await placeCaretInRenderedText(page, "[0,0]", 17);
  await page.keyboard.press("Delete");

  const renderedDocument = page.getByLabel("已渲染文档");

  await expect(renderedDocument.locator("p")).toHaveCount(1);
  await expect(renderedDocument).toContainText("你好，crucialy-rich。");
  await expect(renderedDocument).toContainText("选区模型已就绪。");
  await expect(page.getByLabel("选区 JSON")).toContainText('"offset": 17');
});

test("splits the paragraph with Enter in the editor", async ({ page }) => {
  await page.goto("/");

  await placeCaretInRenderedText(page, "[0,0]", 3);
  await page.keyboard.press("Enter");

  const renderedDocument = page.getByLabel("已渲染文档");

  await expect(renderedDocument.locator("p")).toHaveCount(3);
  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"text": "你好，"',
  );
  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"text": "crucialy-rich。"',
  );
  await expect(page.getByLabel("选区 JSON")).toContainText('"offset": 0');
});

test("continues typing in the new paragraph after Enter", async ({ page }) => {
  await page.goto("/");

  await placeCaretInRenderedText(page, "[0,0]", 3);
  await page.keyboard.press("Enter");
  await page.keyboard.type("新段");

  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"text": "新段crucialy-rich。"',
  );
  await expect(page.getByLabel("选区 JSON")).toContainText('"offset": 2');
});

test("creates another empty paragraph with Enter in an empty paragraph", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByLabel("模型示例").selectOption("empty");
  await page.getByRole("button", { name: "规范化" }).click();
  await placeCaretInRenderedText(page, "[0,0]", 0);
  await page.keyboard.press("Enter");

  await expect(page.getByLabel("已渲染文档").locator("p")).toHaveCount(2);
  await expect(page.getByLabel("选区 JSON")).toContainText('"offset": 0');
});

test("applies delete text from the operation controls", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("锚点偏移").fill("0");
  await page.getByLabel("焦点偏移").fill("3");
  await page.getByRole("button", { name: "删除选区" }).click();

  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"text": "crucialy-rich。"',
  );
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    '"operations"',
  );
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    '"type": "delete_text"',
  );
  await expect(page.getByLabel("选区 JSON")).toContainText('"offset": 0');
});

test("applies split block from the operation controls", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("锚点偏移").fill("3");
  await page.getByRole("button", { name: "分段" }).click();

  const renderedDocument = page.getByLabel("已渲染文档");

  await expect(renderedDocument.locator("p")).toHaveCount(3);
  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"text": "你好，"',
  );
  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"text": "crucialy-rich。"',
  );
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    '"operations"',
  );
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    '"type": "split_block"',
  );
  await expect(page.getByLabel("选区 JSON")).toContainText('"offset": 0');
});

test("applies merge block from the operation controls", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("锚点路径").fill("1,0");
  await page.getByLabel("锚点偏移").fill("0");
  await page.getByRole("button", { name: "合并段落" }).click();

  const renderedDocument = page.getByLabel("已渲染文档");

  await expect(renderedDocument.locator("p")).toHaveCount(1);
  await expect(renderedDocument).toContainText("你好，crucialy-rich。");
  await expect(renderedDocument).toContainText("选区模型已就绪。");
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    '"operations"',
  );
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    '"type": "merge_block"',
  );
  await expect(page.getByLabel("选区 JSON")).toContainText('"offset": 17');
});

test("highlights the selected document json node", async ({ page }) => {
  await page.goto("/");

  const highlightedLines = page.locator('.json-line[data-selected="true"]');

  await expect(
    highlightedLines.filter({ hasText: "你好，crucialy-rich。" }),
  ).toBeVisible();

  await page.getByLabel("锚点路径").fill("1,0");

  await expect(highlightedLines.filter({ hasText: "选区模型已就绪。" })).toBeVisible();
});
