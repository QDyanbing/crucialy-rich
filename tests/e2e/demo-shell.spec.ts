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

async function setDebuggerSelection(
  page: Page,
  path: string,
  anchorOffset: number,
  focusOffset: number,
) {
  await page.getByLabel("锚点路径").fill(path);
  await page.getByLabel("焦点路径").fill(path);
  await page.getByLabel("锚点偏移").fill(String(anchorOffset));
  await page.getByLabel("焦点偏移").fill(String(focusOffset));
}

async function setDebuggerRange(
  page: Page,
  anchorPath: string,
  anchorOffset: number,
  focusPath: string,
  focusOffset: number,
) {
  await page.getByLabel("锚点路径").fill(anchorPath);
  await page.getByLabel("焦点路径").fill(focusPath);
  await page.getByLabel("锚点偏移").fill(String(anchorOffset));
  await page.getByLabel("焦点偏移").fill(String(focusOffset));
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

test("renders every heading level from the demo example", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("headings");

  const renderedDocument = page.getByLabel("已渲染文档");

  for (const [level, text] of [
    [1, "一级标题"],
    [2, "二级标题"],
    [3, "三级标题"],
    [4, "四级标题"],
    [5, "五级标题"],
    [6, "六级标题"],
  ] as const) {
    await expect(
      renderedDocument.locator(`h${level}[data-crucialy-path="[${level - 1}]"]`),
    ).toHaveText(text);
  }
});

test("renders the mixed block type acceptance sample", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("block-types");

  const renderedDocument = page.getByLabel("已渲染文档");

  await expect(
    renderedDocument.locator('h2[data-crucialy-path="[0]"] strong'),
  ).toHaveText("项目概览");
  await expect(renderedDocument.locator('p[data-crucialy-path="[1]"] em')).toHaveText(
    "正文用于说明段落、标题与引用可以连续切换。",
  );
  await expect(
    renderedDocument.locator('blockquote[data-crucialy-path="[2]"] u'),
  ).toHaveText("重要引用内容");
  await expect(renderedDocument.locator('p[data-crucialy-path="[3]"]')).toHaveText(
    "未选中的结尾段落保持原样。",
  );
  await expect(page.getByLabel("标题层级")).toHaveValue("paragraph");
  await expect(page.getByRole("button", { name: "引用", exact: true })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});

test("turns the selected mixed blocks into headings", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("block-types");

  const renderedDocument = page.getByLabel("已渲染文档");

  await page.getByLabel("标题层级").selectOption("3");

  await expect(
    renderedDocument.locator('h3[data-crucialy-path="[0]"] strong'),
  ).toHaveText("项目概览");
  await expect(renderedDocument.locator('h3[data-crucialy-path="[1]"] em')).toHaveText(
    "正文用于说明段落、标题与引用可以连续切换。",
  );
  await expect(renderedDocument.locator('h3[data-crucialy-path="[2]"] u')).toHaveText(
    "重要引用内容",
  );
  await expect(renderedDocument.locator('p[data-crucialy-path="[3]"]')).toHaveText(
    "未选中的结尾段落保持原样。",
  );
  await expect(page.getByLabel("标题层级")).toHaveValue("3");

  const transactionText = await page
    .getByLabel("最近 Transaction", { exact: true })
    .textContent();

  expect(transactionText?.match(/"set_block_type"/g)).toHaveLength(3);
  await expect(page.getByLabel("模型校验状态")).toContainText("合法");
});

test("toggles quote across the selected mixed blocks", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("block-types");

  const quoteButton = page.getByRole("button", { name: "引用", exact: true });
  const renderedDocument = page.getByLabel("已渲染文档");

  await quoteButton.click();

  await expect(renderedDocument.locator("blockquote")).toHaveCount(3);
  await expect(
    renderedDocument.locator('blockquote[data-crucialy-path="[0]"] strong'),
  ).toHaveText("项目概览");
  await expect(
    renderedDocument.locator('blockquote[data-crucialy-path="[1]"] em'),
  ).toHaveText("正文用于说明段落、标题与引用可以连续切换。");
  await expect(
    renderedDocument.locator('blockquote[data-crucialy-path="[2]"] u'),
  ).toHaveText("重要引用内容");
  await expect(renderedDocument.locator('p[data-crucialy-path="[3]"]')).toHaveText(
    "未选中的结尾段落保持原样。",
  );
  await expect(quoteButton).toHaveAttribute("aria-pressed", "true");

  await quoteButton.click();

  await expect(renderedDocument.locator("blockquote")).toHaveCount(0);
  await expect(
    renderedDocument.locator('p[data-crucialy-path="[0]"] strong'),
  ).toHaveText("项目概览");
  await expect(renderedDocument.locator('p[data-crucialy-path="[1]"] em')).toHaveText(
    "正文用于说明段落、标题与引用可以连续切换。",
  );
  await expect(renderedDocument.locator('p[data-crucialy-path="[2]"] u')).toHaveText(
    "重要引用内容",
  );
  await expect(quoteButton).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByLabel("模型校验状态")).toContainText("合法");
});

test("switches heading levels and keeps editing before restoring a paragraph", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("headings");

  const headingSelect = page.getByLabel("标题层级");
  const renderedDocument = page.getByLabel("已渲染文档");

  await expect(headingSelect).toHaveValue("1");
  await headingSelect.selectOption("4");

  await expect(renderedDocument.locator('h4[data-crucialy-path="[0]"]')).toHaveText(
    "一级标题",
  );
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    '"type": "set_block_type"',
  );
  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"level": 4',
  );

  await placeCaretInRenderedText(page, "[0,0]", 4);
  await page.keyboard.type("续");

  await expect(renderedDocument.locator('h4[data-crucialy-path="[0]"]')).toHaveText(
    "一级标题续",
  );

  await headingSelect.selectOption("paragraph");

  await expect(renderedDocument.locator('p[data-crucialy-path="[0]"]')).toHaveText(
    "一级标题续",
  );
  await expect(renderedDocument.locator('h4[data-crucialy-path="[0]"]')).toHaveCount(0);
  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"type": "paragraph"',
  );
});

test("switches multiple selected blocks to one heading level", async ({ page }) => {
  await page.goto("/");
  await setDebuggerRange(page, "0,0", 1, "1,0", 3);

  const renderedDocument = page.getByLabel("已渲染文档");

  await page.getByLabel("标题层级").selectOption("2");

  await expect(renderedDocument.locator('h2[data-crucialy-path="[0]"]')).toHaveText(
    "你好，crucialy-rich。",
  );
  await expect(renderedDocument.locator('h2[data-crucialy-path="[1]"]')).toHaveText(
    "选区模型已就绪。",
  );
  await expect(page.getByLabel("锚点路径")).toHaveValue("0,0");
  await expect(page.getByLabel("焦点路径")).toHaveValue("1,0");
  await expect(page.getByLabel("模型校验状态")).toContainText("合法");
});

test("toggles quote blocks from the demo control", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("quotes");

  const quoteButton = page.getByRole("button", { name: "引用", exact: true });
  const renderedDocument = page.getByLabel("已渲染文档");

  await expect(
    renderedDocument.locator('blockquote[data-crucialy-path="[0]"]'),
  ).toHaveText("引用内容");
  await expect(quoteButton).toHaveAttribute("aria-pressed", "true");

  await quoteButton.click();

  await expect(renderedDocument.locator('p[data-crucialy-path="[0]"]')).toHaveText(
    "引用内容",
  );
  await expect(quoteButton).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    '"type": "set_block_type"',
  );

  await quoteButton.click();

  await expect(
    renderedDocument.locator('blockquote[data-crucialy-path="[0]"]'),
  ).toHaveText("引用内容");
  await expect(quoteButton).toHaveAttribute("aria-pressed", "true");
});

test("toggles multiple selected blocks from the quote control", async ({ page }) => {
  await page.goto("/");
  await setDebuggerRange(page, "0,0", 1, "1,0", 3);

  const quoteButton = page.getByRole("button", { name: "引用", exact: true });
  const renderedDocument = page.getByLabel("已渲染文档");

  await quoteButton.click();

  await expect(renderedDocument.locator("blockquote")).toHaveCount(2);
  await expect(
    renderedDocument.locator('blockquote[data-crucialy-path="[0]"]'),
  ).toHaveText("你好，crucialy-rich。");
  await expect(
    renderedDocument.locator('blockquote[data-crucialy-path="[1]"]'),
  ).toHaveText("选区模型已就绪。");
  await expect(quoteButton).toHaveAttribute("aria-pressed", "true");

  await quoteButton.click();

  await expect(renderedDocument.locator("blockquote")).toHaveCount(0);
  await expect(renderedDocument.locator('p[data-crucialy-path="[0]"]')).toHaveText(
    "你好，crucialy-rich。",
  );
  await expect(renderedDocument.locator('p[data-crucialy-path="[1]"]')).toHaveText(
    "选区模型已就绪。",
  );
  await expect(quoteButton).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByLabel("模型校验状态")).toContainText("合法");
});

test("keeps quote input deletion and line breaks stable", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("quotes");

  const renderedDocument = page.getByLabel("已渲染文档");

  await placeCaretInRenderedText(page, "[0,0]", 4);
  await page.keyboard.type("续");

  await expect(
    renderedDocument.locator('blockquote[data-crucialy-path="[0]"]'),
  ).toHaveText("引用内容续");

  await page.keyboard.press("Backspace");

  await expect(
    renderedDocument.locator('blockquote[data-crucialy-path="[0]"]'),
  ).toHaveText("引用内容");

  await placeCaretInRenderedText(page, "[0,0]", 2);
  await page.keyboard.press("Enter");

  const quotes = renderedDocument.locator("blockquote");

  await expect(quotes).toHaveCount(2);
  await expect(quotes.nth(0)).toHaveText("引用");
  await expect(quotes.nth(1)).toHaveText("内容");

  await page.keyboard.type("新");

  await expect(quotes.nth(1)).toHaveText("新内容");
  await expect(page.getByLabel("模型校验状态")).toContainText("合法");
});

test("updates the selection debug preview", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("锚点偏移").fill("3");
  await page.getByLabel("焦点偏移").fill("11");

  await expect(page.getByLabel("选中文本")).toContainText("crucialy");
  await expect(page.getByLabel("选区 JSON")).toContainText('"offset": 11');
});

test("updates command states from the current selection", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByLabel("插入 Command 状态")).toContainText("可用");
  await expect(page.getByLabel("加粗 Command 状态")).toContainText("可用");
  await expect(page.getByLabel("斜体 Command 状态")).toContainText("可用");
  await expect(page.getByLabel("删除选区 Command 状态")).toContainText("可用");
  await expect(page.getByLabel("分段 Command 状态")).toContainText("不可用");
  await expect(page.getByLabel("合并段落 Command 状态")).toContainText("不可用");

  await page.getByLabel("焦点偏移").fill("0");

  await expect(page.getByLabel("删除选区 Command 状态")).toContainText("不可用");
  await expect(page.getByLabel("分段 Command 状态")).toContainText("可用");

  await page.getByLabel("锚点路径").fill("1,0");
  await page.getByLabel("焦点路径").fill("1,0");

  await expect(page.getByLabel("合并段落 Command 状态")).toContainText("可用");
});

test("toggles bold from the demo controls", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "加粗" }).click();

  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"marks": {',
  );
  await expect(page.getByLabel("文档 JSON 选区映射")).toContainText(
    '"marks": {"bold":true}',
  );
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    '"type": "toggle_mark"',
  );
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    '"mark": "bold"',
  );
  await expect(
    page.getByLabel("已渲染文档").locator('strong[data-crucialy-path="[0,0]"]'),
  ).toContainText("你好，cr");
  await expect(page.getByLabel("加粗 Command 状态")).toContainText("激活");
});

test("toggles italic from the demo controls", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "斜体" }).click();

  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"marks": {',
  );
  await expect(page.getByLabel("文档 JSON 选区映射")).toContainText(
    '"marks": {"italic":true}',
  );
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    '"type": "toggle_mark"',
  );
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    '"mark": "italic"',
  );
  await expect(
    page.getByLabel("已渲染文档").locator('em[data-crucialy-path="[0,0]"]'),
  ).toContainText("你好，cr");
  await expect(page.getByLabel("斜体 Command 状态")).toContainText("激活");
});

test("toggles underline without changing bold", async ({ page }) => {
  await page.goto("/");

  const renderedDocument = page.getByLabel("已渲染文档");
  const boldButton = page.getByRole("button", { name: "加粗" });
  const underlineButton = page.getByRole("button", { name: "下划线" });

  await expect(page.getByLabel("下划线 Command 状态")).toContainText("可用");
  await expect(underlineButton).toHaveAttribute("aria-pressed", "false");

  await underlineButton.click();

  await expect(underlineButton).toHaveAttribute("aria-pressed", "true");
  await expect(renderedDocument.locator('u[data-crucialy-path="[0,0]"]')).toContainText(
    "你好，cr",
  );

  await boldButton.click();

  const stackedText = renderedDocument.locator('strong[data-crucialy-path="[0,0]"]');

  await expect(boldButton).toHaveAttribute("aria-pressed", "true");
  await expect(underlineButton).toHaveAttribute("aria-pressed", "true");
  await expect(stackedText).toHaveAttribute("style", "text-decoration: underline;");

  await underlineButton.click();

  await expect(boldButton).toHaveAttribute("aria-pressed", "true");
  await expect(underlineButton).toHaveAttribute("aria-pressed", "false");
  await expect(stackedText).not.toHaveAttribute("style", /text-decoration/);
});

test("toggles strike without changing underline", async ({ page }) => {
  await page.goto("/");

  const renderedDocument = page.getByLabel("已渲染文档");
  const strikeButton = page.getByRole("button", { name: "删除线" });
  const underlineButton = page.getByRole("button", { name: "下划线" });

  await expect(page.getByLabel("删除线 Command 状态")).toContainText("可用");
  await expect(strikeButton).toHaveAttribute("aria-pressed", "false");

  await strikeButton.click();

  await expect(strikeButton).toHaveAttribute("aria-pressed", "true");
  await expect(renderedDocument.locator('s[data-crucialy-path="[0,0]"]')).toContainText(
    "你好，cr",
  );

  await underlineButton.click();

  const stackedText = renderedDocument.locator('span[data-crucialy-path="[0,0]"]');

  await expect(strikeButton).toHaveAttribute("aria-pressed", "true");
  await expect(underlineButton).toHaveAttribute("aria-pressed", "true");
  await expect(stackedText).toHaveAttribute(
    "style",
    "text-decoration: underline line-through;",
  );

  await strikeButton.click();

  await expect(strikeButton).toHaveAttribute("aria-pressed", "false");
  await expect(underlineButton).toHaveAttribute("aria-pressed", "true");
  await expect(
    renderedDocument.locator('u[data-crucialy-path="[0,0]"]'),
  ).not.toHaveAttribute("style");
});

test("completes the bold and italic acceptance loop", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("marks");

  const renderedDocument = page.getByLabel("已渲染文档");
  const acceptanceParagraph = renderedDocument.locator("p").nth(1);
  const boldButton = page.getByRole("button", { name: "加粗" });
  const italicButton = page.getByRole("button", { name: "斜体" });

  await expect(renderedDocument).toContainText("加粗文本");
  await expect(renderedDocument).toContainText("斜体文本");
  await expect(page.getByLabel("选中文本")).toContainText("跨节点选区可以继续切换。");
  await expect(boldButton).toHaveAttribute("aria-pressed", "false");
  await expect(italicButton).toHaveAttribute("aria-pressed", "false");

  await boldButton.click();

  await expect(boldButton).toHaveAttribute("aria-pressed", "true");
  await expect(italicButton).toHaveAttribute("aria-pressed", "false");
  await expect(acceptanceParagraph.locator("strong").first()).toContainText(
    "跨节点选区可以",
  );

  await italicButton.click();

  await expect(boldButton).toHaveAttribute("aria-pressed", "true");
  await expect(italicButton).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"bold": true',
  );
  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"italic": true',
  );

  await boldButton.click();

  await expect(boldButton).toHaveAttribute("aria-pressed", "false");
  await expect(italicButton).toHaveAttribute("aria-pressed", "true");
  await expect(acceptanceParagraph.locator("em")).toContainText(
    "跨节点选区可以继续切换。",
  );
});

test("completes the underline and strike acceptance loop", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("marks");

  const renderedDocument = page.getByLabel("已渲染文档");
  const acceptanceParagraph = renderedDocument.locator("p").nth(1);
  const underlineButton = page.getByRole("button", { name: "下划线" });
  const strikeButton = page.getByRole("button", { name: "删除线" });

  await expect(renderedDocument).toContainText("下划线文本");
  await expect(renderedDocument).toContainText("删除线文本");
  const combinedText = renderedDocument.locator('[data-crucialy-path="[0,11]"]');

  await expect(combinedText).toHaveCSS("color", "rgb(212, 56, 13)");
  await expect(combinedText).toHaveCSS("font-size", "18px");
  await expect(combinedText).toHaveCSS("font-style", "italic");
  await expect(combinedText).toHaveCSS(
    "text-decoration-line",
    "underline line-through",
  );
  await expect(underlineButton).toHaveAttribute("aria-pressed", "false");
  await expect(strikeButton).toHaveAttribute("aria-pressed", "false");

  await underlineButton.click();
  await strikeButton.click();

  await expect(underlineButton).toHaveAttribute("aria-pressed", "true");
  await expect(strikeButton).toHaveAttribute("aria-pressed", "true");
  await expect(
    acceptanceParagraph.locator('[style*="text-decoration: underline line-through"]'),
  ).toHaveCount(5);

  await underlineButton.click();

  await expect(underlineButton).toHaveAttribute("aria-pressed", "false");
  await expect(strikeButton).toHaveAttribute("aria-pressed", "true");
  await expect(
    acceptanceParagraph.locator('[style*="text-decoration: underline"]'),
  ).toHaveCount(0);

  await strikeButton.click();

  await expect(underlineButton).toHaveAttribute("aria-pressed", "false");
  await expect(strikeButton).toHaveAttribute("aria-pressed", "false");
  await expect(acceptanceParagraph).toContainText("跨节点选区可以继续切换。");
});

test("renders the mixed text style acceptance sample", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("marks");

  const combinedText = page
    .getByLabel("已渲染文档")
    .locator('[data-crucialy-path="[0,11]"]');

  await expect(combinedText).toContainText("组合格式");
  await expect(combinedText).toHaveCSS("background-color", "rgb(255, 241, 240)");
  await expect(combinedText).toHaveCSS("color", "rgb(212, 56, 13)");
  await expect(combinedText).toHaveCSS("font-size", "18px");
  await expect(combinedText).toHaveCSS("font-style", "italic");
  await expect(combinedText).toHaveCSS("font-weight", "700");
  await expect(combinedText).toHaveCSS(
    "text-decoration-line",
    "underline line-through",
  );
  await expect(page.getByLabel("模型校验状态")).toContainText("合法");
});

test("sets, replaces, and removes links from the demo popover", async ({ page }) => {
  await page.goto("/");

  const documentJson = page.getByLabel("文档 JSON", { exact: true });
  const transaction = page.getByLabel("最近 Transaction", { exact: true });
  const linkButton = page.getByRole("button", { name: "链接", exact: true });
  const unsetLinkButton = page.getByRole("button", { name: "取消链接" });

  await expect(page.getByLabel("设置链接 Command 状态")).toContainText("可用");
  await expect(unsetLinkButton).toBeDisabled();

  await linkButton.click();
  await expect(page.getByLabel("链接设置")).toBeVisible();
  await page.getByLabel("链接地址").fill("https://example.com/first");
  await page.getByRole("button", { name: "确认链接" }).click();

  await expect(documentJson).toContainText('"href": "https://example.com/first"');
  await expect(documentJson).toContainText('"target": "_blank"');
  await expect(transaction).toContainText('"type": "set_link"');
  await expect(page.getByLabel("设置链接 Command 状态")).toContainText("激活");
  await expect(unsetLinkButton).toBeEnabled();

  await linkButton.click();
  await page.getByLabel("链接地址").fill("https://example.com/latest");
  await page.getByRole("button", { name: "确认链接" }).click();

  await expect(documentJson).toContainText('"href": "https://example.com/latest"');
  await expect(documentJson).not.toContainText("https://example.com/first");

  await unsetLinkButton.click();

  await expect(transaction).toContainText('"link": null');
  await expect(documentJson).not.toContainText('"link": {');
  await expect(unsetLinkButton).toBeDisabled();
});

test("creates a link from the acceptance sample", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("links");
  await setDebuggerSelection(page, "0,2", 1, 6);

  await expect(page.getByLabel("选中文本")).toContainText("待创建链接");
  await expect(page.getByLabel("选中链接状态")).toContainText("选区无统一链接");

  await page.getByRole("button", { name: "链接", exact: true }).click();
  await page.getByLabel("链接地址").fill("https://example.com/created");
  await page.getByLabel("链接打开方式").selectOption("_self");
  await page.getByLabel("链接 rel").fill("nofollow");
  await page.getByRole("button", { name: "确认链接" }).click();

  const createdLink = page
    .getByLabel("已渲染文档")
    .getByRole("link", { name: "待创建链接" });

  await expect(createdLink).toHaveAttribute("href", "https://example.com/created");
  await expect(createdLink).toHaveAttribute("target", "_self");
  await expect(createdLink).toHaveAttribute("rel", "nofollow");
  await expect(page.getByLabel("模型校验状态")).toContainText("合法");
});

test("edits the existing link in the acceptance sample", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("links");

  await expect(page.getByLabel("选中文本")).toContainText("已有链接");
  await expect(page.getByLabel("选中链接状态")).toContainText(
    "https://example.com/original",
  );

  await page.getByRole("button", { name: "链接", exact: true }).click();
  await expect(page.getByLabel("链接地址")).toHaveValue("https://example.com/original");
  await page.getByLabel("链接地址").fill("https://example.com/edited");
  await page.getByLabel("链接打开方式").selectOption("_self");
  await page.getByLabel("链接 rel").fill("nofollow");
  await page.getByRole("button", { name: "确认链接" }).click();

  const editedLink = page
    .getByLabel("已渲染文档")
    .getByRole("link", { name: "已有链接" });

  await expect(editedLink).toHaveAttribute("href", "https://example.com/edited");
  await expect(editedLink).toHaveAttribute("target", "_self");
  await expect(editedLink).toHaveAttribute("rel", "nofollow");
  await expect(page.getByLabel("文档 JSON", { exact: true })).not.toContainText(
    "https://example.com/original",
  );
  await expect(page.getByLabel("选中链接状态")).toContainText(
    "https://example.com/edited",
  );
});

test("cancels the existing link in the acceptance sample", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("links");

  const editor = page.getByLabel("已渲染文档");
  const unsetLinkButton = page.getByRole("button", { name: "取消链接" });

  await expect(editor.getByRole("link", { name: "已有链接" })).toBeVisible();
  await expect(unsetLinkButton).toBeEnabled();

  await unsetLinkButton.click();

  await expect(editor).toContainText("已有链接");
  await expect(editor.getByRole("link", { name: "已有链接" })).toHaveCount(0);
  await expect(page.getByLabel("文档 JSON", { exact: true })).not.toContainText(
    '"link": {',
  );
  await expect(page.getByLabel("选中链接状态")).toContainText("选区无统一链接");
  await expect(unsetLinkButton).toBeDisabled();
  await expect
    .poll(() => page.evaluate(() => window.getSelection()?.toString()))
    .toBe("已有链接");
});

test("restores link selection when the menu opens from the keyboard", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("links");

  const linkButton = page.getByRole("button", { name: "链接", exact: true });

  await linkButton.focus();
  await linkButton.press("Enter");
  await expect(page.getByLabel("链接设置")).toBeVisible();
  await page.getByLabel("链接地址").fill("https://example.com/keyboard");

  await setDebuggerSelection(page, "0,2", 1, 6);
  await page.evaluate(() => window.getSelection()?.removeAllRanges());
  await page.getByRole("button", { name: "确认链接" }).click();

  await expect(
    page.getByLabel("已渲染文档").getByRole("link", { name: "已有链接" }),
  ).toHaveAttribute("href", "https://example.com/keyboard");
  await expect(page.getByLabel("锚点路径")).toHaveValue("0,1");
  await expect(page.getByLabel("焦点路径")).toHaveValue("0,1");
  await expect(page.getByLabel("锚点偏移")).toHaveValue("0");
  await expect(page.getByLabel("焦点偏移")).toHaveValue("4");
  await expect
    .poll(() => page.evaluate(() => window.getSelection()?.toString()))
    .toBe("已有链接");
});

test("restores the saved selection after confirming a link", async ({ page }) => {
  await page.goto("/");

  const editor = page.getByLabel("已渲染文档");
  const linkButton = page.getByRole("button", { name: "链接", exact: true });

  await linkButton.click();
  await page.getByLabel("链接地址").fill("https://example.com/saved-selection");

  await page.getByLabel("锚点偏移").fill("7");
  await page.getByLabel("焦点偏移").fill("12");
  await page.evaluate(() => window.getSelection()?.removeAllRanges());

  await page.getByRole("button", { name: "确认链接" }).click();

  const restoredLink = editor.getByRole("link", { name: "你好，cr" });

  await expect(restoredLink).toHaveAttribute(
    "href",
    "https://example.com/saved-selection",
  );
  await expect(editor.locator("a")).toHaveCount(1);
  await expect(page.getByLabel("锚点偏移")).toHaveValue("0");
  await expect(page.getByLabel("焦点偏移")).toHaveValue("5");
  await expect
    .poll(() => page.evaluate(() => window.getSelection()?.toString()))
    .toBe("你好，cr");
});

test("blocks unsafe links in the demo popover", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "链接", exact: true }).click();
  await page.getByLabel("链接地址").fill("javascript:alert(1)");

  await expect(page.getByRole("button", { name: "确认链接" })).toBeDisabled();
  await expect(page.getByLabel("设置链接 Command 状态")).toContainText("不可用");
  await expect(page.getByLabel("模型校验状态")).toContainText("合法");
});

test("keeps editable links selectable without navigating", async ({ page }) => {
  await page.goto("/");

  const editor = page.getByLabel("编辑态链接示例");
  const link = editor.getByRole("link", { name: "打开 crucialy-rich 文档" });

  await expect(link).toHaveAttribute("href", "https://example.com/crucialy-rich");
  await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  await expect(link).toHaveAttribute("target", "_blank");

  const popupPromise = page.waitForEvent("popup", { timeout: 500 }).catch(() => null);

  await link.click();

  expect(await popupPromise).toBeNull();
  expect(page.url()).toMatch(/^http:\/\/(127\.0\.0\.1|localhost):\d+\/$/);

  const selectedText = await link.evaluate((element) => {
    const range = document.createRange();
    const selection = window.getSelection();

    if (!selection) {
      throw new Error("Missing browser selection.");
    }

    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);

    return selection.toString();
  });

  expect(selectedText).toBe("打开 crucialy-rich 文档");
});

test("keeps native navigation for readonly links", async ({ page }) => {
  await page.goto("/");

  const editor = page.getByLabel("只读态链接示例");
  const link = editor.getByRole("link", { name: "打开 crucialy-rich 文档" });

  await expect(editor).toHaveAttribute("aria-readonly", "true");

  const [popup] = await Promise.all([page.waitForEvent("popup"), link.click()]);

  await expect.poll(() => popup.url()).toContain("https://example.com/crucialy-rich");
  await popup.close();
});

test("reads selected link state and restores link fields", async ({ page }) => {
  await page.goto("/");

  const linkButton = page.getByRole("button", { name: "链接", exact: true });
  const selectedLinkState = page.getByLabel("选中链接状态");

  await expect(selectedLinkState).toContainText("选区无统一链接");

  await linkButton.click();
  await page.getByLabel("链接地址").fill("https://example.com/original");
  await page.getByRole("button", { name: "确认链接" }).click();

  await expect(selectedLinkState).toContainText("https://example.com/original");

  await page.getByLabel("锚点偏移").fill("2");
  await page.getByLabel("焦点偏移").fill("2");

  await expect(selectedLinkState).toContainText("https://example.com/original");

  await linkButton.click();
  await page.getByLabel("链接地址").fill("https://example.com/draft");
  await page.getByLabel("链接打开方式").selectOption("_self");
  await page.getByLabel("链接 rel").fill("");
  await page.getByRole("button", { name: "关闭" }).click();

  await linkButton.click();

  await expect(page.getByLabel("链接地址")).toHaveValue("https://example.com/original");
  await expect(page.getByLabel("链接打开方式")).toHaveValue("_blank");
  await expect(page.getByLabel("链接 rel")).toHaveValue("noopener noreferrer");
});

test("sets and cancels font size from the demo control", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("marks");

  const renderedDocument = page.getByLabel("已渲染文档");
  const acceptanceParagraph = renderedDocument.locator("p").nth(1);
  const fontSizeSelect = page.getByLabel("字号", { exact: true });

  await expect(renderedDocument).toContainText("彩色大号文本");
  const coloredSizedText = renderedDocument.locator('[data-crucialy-path="[0,9]"]');
  await expect(coloredSizedText).toHaveCSS("color", "rgb(22, 119, 255)");
  await expect(coloredSizedText).toHaveCSS("font-size", "24px");
  await expect(page.getByLabel("字号 Command 状态")).toContainText("可用");

  await fontSizeSelect.selectOption("24");

  await expect(acceptanceParagraph.locator('[style*="font-size: 24px"]')).toHaveCount(
    5,
  );
  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"fontSize": 24',
  );
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    '"type": "set_mark_attribute"',
  );
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    '"value": 24',
  );

  await fontSizeSelect.selectOption("default");

  await expect(acceptanceParagraph.locator('[style*="font-size"]')).toHaveCount(0);
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    '"value": null',
  );
});

test("sets and cancels text color from the demo control", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("marks");

  const acceptanceParagraph = page.getByLabel("已渲染文档").locator("p").nth(1);
  const textColorInput = page.getByLabel("文字颜色", { exact: true });

  await expect(page.getByLabel("文字颜色 Command 状态")).toContainText("可用");

  await textColorInput.fill("#52c41a");

  await expect(acceptanceParagraph.locator('[style*="color"]')).toHaveCount(5);
  await expect(acceptanceParagraph.locator("span").first()).toHaveCSS(
    "color",
    "rgb(82, 196, 26)",
  );
  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"textColor": "#52c41a"',
  );
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    '"attribute": "textColor"',
  );
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    '"value": "#52c41a"',
  );

  await page.getByRole("button", { name: "取消文字颜色" }).click();

  await expect(acceptanceParagraph.locator('[style*="color"]')).toHaveCount(0);
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    '"value": null',
  );
});

test("sets and cancels background color without removing text color", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("marks");

  const acceptanceParagraph = page.getByLabel("已渲染文档").locator("p").nth(1);
  const textColorInput = page.getByLabel("文字颜色", { exact: true });
  const backgroundColorInput = page.getByLabel("背景色", { exact: true });

  await expect(page.getByLabel("背景色 Command 状态")).toContainText("可用");

  await textColorInput.fill("#52c41a");
  await backgroundColorInput.fill("#ffe58f");

  await expect(acceptanceParagraph.locator('[style*="background-color"]')).toHaveCount(
    5,
  );
  await expect(acceptanceParagraph.locator("span").first()).toHaveCSS(
    "background-color",
    "rgb(255, 229, 143)",
  );
  await expect(acceptanceParagraph.locator("span").first()).toHaveCSS(
    "color",
    "rgb(82, 196, 26)",
  );
  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"backgroundColor": "#ffe58f"',
  );
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    '"attribute": "backgroundColor"',
  );
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    '"value": "#ffe58f"',
  );

  await page.getByRole("button", { name: "取消背景色" }).click();

  await expect(acceptanceParagraph.locator('[style*="background-color"]')).toHaveCount(
    0,
  );
  await expect(acceptanceParagraph.locator('[style*="color"]')).toHaveCount(5);
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    '"value": null',
  );
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
    '"text": "新文本ucialy-rich。"',
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

test("undos and redoes operation control changes", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "撤销" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "重做" })).toBeDisabled();
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
  await expect(page.getByLabel("History 状态")).toContainText('"redoStack": 0');

  await page.getByLabel("插入文本").fill("回");
  await page.getByRole("button", { name: "插入" }).click();

  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"text": "回ucialy-rich。"',
  );
  await expect(page.getByRole("button", { name: "撤销" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "重做" })).toBeDisabled();
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
  await expect(page.getByLabel("History 状态")).toContainText('"redoStack": 0');

  await page.getByRole("button", { name: "撤销" }).click();

  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"text": "你好，crucialy-rich。"',
  );
  await expect(page.getByRole("button", { name: "撤销" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "重做" })).toBeEnabled();
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
  await expect(page.getByLabel("History 状态")).toContainText('"redoStack": 1');

  await page.getByRole("button", { name: "重做" }).click();

  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"text": "回ucialy-rich。"',
  );
  await expect(page.getByRole("button", { name: "撤销" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "重做" })).toBeDisabled();
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
  await expect(page.getByLabel("History 状态")).toContainText('"redoStack": 0');
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

test("records editor typing in history", async ({ page }) => {
  await page.goto("/");

  await placeCaretInRenderedText(page, "[0,0]", 3);
  await page.keyboard.type("真");

  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
  await expect(page.getByRole("button", { name: "撤销" })).toBeEnabled();

  await page.getByRole("button", { name: "撤销" }).click();

  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"text": "你好，crucialy-rich。"',
  );
  await expect(page.getByLabel("History 状态")).toContainText('"redoStack": 1');
  await expect(page.getByRole("button", { name: "重做" })).toBeEnabled();

  await page.getByRole("button", { name: "重做" }).click();

  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"text": "你好，真crucialy-rich。"',
  );
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
});

test("undos editor typing with keyboard shortcut", async ({ page }) => {
  await page.goto("/");

  await placeCaretInRenderedText(page, "[0,0]", 3);
  await page.keyboard.type("真");
  await page.keyboard.press("Control+Z");

  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"text": "你好，crucialy-rich。"',
  );
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
  await expect(page.getByLabel("History 状态")).toContainText('"redoStack": 1');
});

test("redoes editor typing with keyboard shortcut", async ({ page }) => {
  await page.goto("/");

  await placeCaretInRenderedText(page, "[0,0]", 3);
  await page.keyboard.type("真");
  await page.keyboard.press("Control+Z");
  await page.keyboard.press("Control+Shift+Z");

  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"text": "你好，真crucialy-rich。"',
  );
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
  await expect(page.getByLabel("History 状态")).toContainText('"redoStack": 0');
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

test("merges consecutive typing into one history item", async ({ page }) => {
  await page.goto("/");

  await placeCaretInRenderedText(page, "[0,0]", 3);
  await page.keyboard.type("输入");

  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"text": "你好，输入crucialy-rich。"',
  );
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');

  await page.getByRole("button", { name: "撤销" }).click();

  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"text": "你好，crucialy-rich。"',
  );
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
  await expect(page.getByLabel("History 状态")).toContainText('"redoStack": 1');
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

test("keeps the model valid after Backspace merge and typing", async ({ page }) => {
  await page.goto("/");

  await placeCaretInRenderedText(page, "[1,0]", 0);
  await page.keyboard.press("Backspace");
  await page.keyboard.type("续");

  await expect(page.getByLabel("模型校验状态")).toContainText("合法");
  await expect(page.getByLabel("已渲染文档").locator("p")).toHaveCount(1);
  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"text": "你好，crucialy-rich。续选区模型已就绪。"',
  );
  await expect(page.getByLabel("选区 JSON")).toContainText('"offset": 18');
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

test("runs a basic editing loop with insert enter and delete", async ({ page }) => {
  await page.goto("/");

  await placeCaretInRenderedText(page, "[0,0]", 3);
  await page.keyboard.type("新");
  await page.keyboard.press("Enter");
  await page.keyboard.type("段");
  await page.keyboard.press("Delete");

  const renderedDocument = page.getByLabel("已渲染文档");

  await expect(renderedDocument.locator("p")).toHaveCount(3);
  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"text": "你好，新"',
  );
  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"text": "段rucialy-rich。"',
  );
  await expect(page.getByLabel("选区 JSON")).toContainText('"offset": 1');
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
  await page.getByLabel("焦点偏移").fill("3");
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
  await page.getByLabel("焦点路径").fill("1,0");
  await page.getByLabel("焦点偏移").fill("0");
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
