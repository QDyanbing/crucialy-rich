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

async function insertEditorText(page: Page, data: string) {
  await page.keyboard.insertText(data);
}

async function selectRenderedTextRange(
  page: Page,
  path: string,
  startOffset: number,
  endOffset: number,
) {
  await page
    .getByLabel("已渲染文档")
    .locator(`[data-crucialy-path="${path}"]`)
    .evaluate(
      (element, offsets) => {
        const text = element.firstChild;
        const range = document.createRange();
        const selection = window.getSelection();
        const renderedDocument = element.closest('[aria-label="已渲染文档"]');

        if (!text || !selection || !(renderedDocument instanceof HTMLElement)) {
          throw new Error("Missing rendered text range target.");
        }

        renderedDocument.focus();
        range.setStart(text, offsets.startOffset);
        range.setEnd(text, offsets.endOffset);
        selection.removeAllRanges();
        selection.addRange(range);
        renderedDocument.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      },
      { endOffset, startOffset },
    );
}

async function selectRenderedTextAcrossNodes(
  page: Page,
  startPath: string,
  startOffset: number,
  endPath: string,
  endOffset: number,
) {
  await page.getByLabel("已渲染文档").evaluate(
    (renderedDocument, target) => {
      const startElement = renderedDocument.querySelector(
        `[data-crucialy-path="${target.startPath}"]`,
      );
      const endElement = renderedDocument.querySelector(
        `[data-crucialy-path="${target.endPath}"]`,
      );
      const startText = startElement?.firstChild;
      const endText = endElement?.firstChild;
      const selection = window.getSelection();

      if (!startText || !endText || !selection) {
        throw new Error("Missing rendered cross-node selection target.");
      }

      (renderedDocument as HTMLElement).focus();
      const range = document.createRange();
      range.setStart(startText, target.startOffset);
      range.setEnd(endText, target.endOffset);
      selection.removeAllRanges();
      selection.addRange(range);
      renderedDocument.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    },
    { endOffset, endPath, startOffset, startPath },
  );
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

test("groups every model example by acceptance area", async ({ page }) => {
  await page.goto("/");

  const groups = page.getByLabel("模型示例").locator("optgroup");

  await expect(groups).toHaveCount(5);
  expect(
    await groups.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("label")),
    ),
  ).toEqual(["输入与选区", "块结构", "复杂结构", "内容能力", "边界场景"]);
  await expect(page.getByLabel("模型示例").locator("option")).toHaveCount(16);
});

test("renders the cross-block editing acceptance sample", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("range-editing");

  const editor = page.getByLabel("已渲染文档");
  await expect(editor.locator("p")).toHaveCount(3);
  await expect(editor.locator("strong")).toHaveText("跨块选区");
  await expect(editor.locator("em")).toHaveText("中间段将被删除。");
  await expect(editor.locator("u")).toHaveText("替换边界");
  await expect(page.getByLabel("选中文本")).toContainText("跨块选区");
  await expect(page.getByLabel("选中文本")).toContainText("替换边界");
  await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
});

test("applies formatting from the fixed toolbar", async ({ page }) => {
  await page.goto("/");

  const fixedToolbar = page.getByRole("toolbar", { name: "固定格式工具栏" });

  await expect(fixedToolbar).toBeVisible();
  await fixedToolbar
    .getByRole("button", { name: "固定工具栏加粗", exact: true })
    .click();

  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"bold": true',
  );
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
});

test("applies formatting and history keyboard shortcuts", async ({ page }) => {
  await page.goto("/");
  await selectRenderedTextRange(page, "[0,0]", 0, 2);

  const documentJson = page.getByLabel("文档 JSON", { exact: true });

  await page.keyboard.press("Control+B");
  await expect(documentJson).toContainText('"bold": true');

  await page.keyboard.press("Control+I");
  await expect(documentJson).toContainText('"italic": true');

  await page.keyboard.press("Control+U");
  await expect(documentJson).toContainText('"underline": true');

  await page.keyboard.press("Control+Z");
  await expect(documentJson).not.toContainText('"underline": true');
  await expect(documentJson).toContainText('"italic": true');

  await page.keyboard.press("Control+Shift+Z");
  await expect(documentJson).toContainText('"underline": true');
  await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
});

test("applies boolean marks across text blocks", async ({ page }) => {
  await page.goto("/");
  await selectRenderedTextAcrossNodes(page, "[0,0]", 3, "[1,0]", 2);

  const editor = page.getByLabel("已渲染文档");
  const boldButton = page.getByRole("button", { name: "加粗", exact: true });
  const italicButton = page.getByRole("button", { name: "斜体", exact: true });

  await boldButton.click();
  await expect(editor.locator("strong")).toHaveCount(2);
  await expect(editor.locator("strong").first()).toHaveText("crucialy-rich。");
  await expect(editor.locator("strong").last()).toHaveText("选区");
  await expect(boldButton).toHaveAttribute("aria-pressed", "true");

  await italicButton.click();
  await expect(editor.locator("strong")).toHaveCount(2);
  await expect(editor.locator("strong").first()).toHaveAttribute(
    "style",
    "font-style: italic;",
  );
  await expect(editor.locator("strong").last()).toHaveAttribute(
    "style",
    "font-style: italic;",
  );
  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"bold": true',
  );
  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"italic": true',
  );
  await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
});

test("restores cross-block marks through history", async ({ page }) => {
  await page.goto("/");
  await selectRenderedTextAcrossNodes(page, "[0,0]", 3, "[1,0]", 2);
  await page.keyboard.press("Control+U");

  const editor = page.getByLabel("已渲染文档");

  await expect(editor.locator("u")).toHaveCount(2);
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');

  await page.getByRole("button", { name: "撤销", exact: true }).click();
  await expect(editor.locator("u")).toHaveCount(0);
  await expect(editor.locator("p").first()).toHaveText("你好，crucialy-rich。");
  await expect(editor.locator("p").last()).toHaveText("选区模型已就绪。");

  await page.getByRole("button", { name: "重做", exact: true }).click();
  await expect(editor.locator("u")).toHaveCount(2);
  await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
});

test("applies Markdown input rules and restores prefixes through undo", async ({
  page,
}) => {
  await page.goto("/");

  const editor = page.getByLabel("已渲染文档");
  const modelExamples = page.getByLabel("模型示例");

  async function resetInputRuleExample() {
    await modelExamples.selectOption("regular");
    await modelExamples.selectOption("input-rules");
    await placeCaretInRenderedText(page, "[0,0]", 0);
  }

  await resetInputRuleExample();
  await insertEditorText(page, "#");
  await expect(editor.locator("p")).toHaveText("#");
  await insertEditorText(page, " ");
  await expect(editor.locator("h1")).toHaveCount(1);
  await page.keyboard.press("Control+Z");
  await expect(editor.locator("p")).toHaveText("#");

  await resetInputRuleExample();
  await insertEditorText(page, "- ");
  await expect(editor.locator("ul > li")).toHaveCount(1);

  await resetInputRuleExample();
  await insertEditorText(page, "1. ");
  await expect(editor.locator("ol > li")).toHaveCount(1);

  await resetInputRuleExample();
  await insertEditorText(page, "> ");
  await expect(editor.locator("blockquote")).toHaveCount(1);

  await resetInputRuleExample();
  await insertEditorText(page, "```");
  await expect(editor.locator("pre > code")).toHaveCount(1);

  await resetInputRuleExample();
  await insertEditorText(page, "正文 # ");
  await expect(editor.locator("p")).toHaveText("正文 # ");
  await expect(editor.locator("h1")).toHaveCount(0);
  await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
});

test("shows and toggles toolbar display modes", async ({ page }) => {
  await page.goto("/");
  await selectRenderedTextRange(page, "[0,0]", 0, 2);

  const fixedToggle = page.getByRole("checkbox", { name: "显示固定工具栏" });
  const floatingToggle = page.getByRole("checkbox", { name: "启用悬浮工具栏" });

  await expect(page.getByRole("toolbar", { name: "悬浮格式工具栏" })).toBeVisible();
  await fixedToggle.uncheck();
  await expect(page.getByRole("toolbar", { name: "固定格式工具栏" })).toHaveCount(0);
  await floatingToggle.uncheck();
  await expect(page.getByRole("toolbar", { name: "悬浮格式工具栏" })).toHaveCount(0);
});

test("keeps the selected range when the floating toolbar runs a command", async ({
  page,
}) => {
  await page.goto("/");
  await selectRenderedTextRange(page, "[0,0]", 0, 2);

  const floatingToolbar = page.getByRole("toolbar", { name: "悬浮格式工具栏" });

  await floatingToolbar
    .getByRole("button", { name: "悬浮工具栏加粗", exact: true })
    .click();

  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"bold": true',
  );
  await expect(page.getByLabel("锚点偏移")).toHaveValue("0");
  await expect(page.getByLabel("焦点偏移")).toHaveValue("2");
  await expect
    .poll(() => page.evaluate(() => window.getSelection()?.toString()))
    .toBe("你好");

  await page.getByRole("button", { name: "撤销", exact: true }).click();
  await expect(page.getByLabel("文档 JSON", { exact: true })).not.toContainText(
    '"bold": true',
  );
});

test("opens and closes the slash menu from editor input", async ({ page }) => {
  await page.goto("/");
  await placeCaretInRenderedText(page, "[0,0]", 0);
  await page.keyboard.type("/");

  const menu = page.getByRole("listbox", { name: "插入块菜单" });

  await expect(menu).toBeVisible();
  await expect(menu.getByRole("option")).toHaveCount(10);
  await expect(menu.getByRole("option").first()).toHaveAttribute(
    "aria-selected",
    "true",
  );

  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(page.getByLabel("已渲染文档")).toContainText("/你好");
});

test("cycles through slash menu options with arrow keys", async ({ page }) => {
  await page.goto("/");
  await placeCaretInRenderedText(page, "[0,0]", 0);
  await page.keyboard.type("/");

  const menu = page.getByRole("listbox", { name: "插入块菜单" });

  await page.keyboard.press("ArrowUp");
  await expect(menu.locator('[aria-selected="true"]')).toContainText("分割线");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(menu.locator('[aria-selected="true"]')).toContainText("2 级标题");
});

test("filters and executes a slash command without leaving trigger text", async ({
  page,
}) => {
  await page.goto("/");
  await placeCaretInRenderedText(page, "[0,0]", 0);
  await page.keyboard.type("/h2");

  const menu = page.getByRole("listbox", { name: "插入块菜单" });

  await expect(menu.getByRole("option")).toHaveCount(1);
  await expect(menu.getByRole("option")).toContainText("2 级标题");
  await page.keyboard.press("Enter");

  const editor = page.getByLabel("已渲染文档");

  await expect(menu).toHaveCount(0);
  await expect(editor.locator('h2[data-crucialy-path="[0]"]')).toContainText("你好");
  await expect(editor).not.toContainText("/h2");
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 2');

  await page.getByRole("button", { name: "撤销", exact: true }).click();
  await expect(editor.locator('p[data-crucialy-path="[0]"]')).toContainText("/h2你好");
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

test("edits and exits a multiline code block", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("code-block");

  const editor = page.getByLabel("已渲染文档");
  const codeButton = page.getByRole("button", { name: "代码块", exact: true });

  await expect(editor.locator('pre[data-crucialy-path="[0]"] code')).toHaveText(
    "const value = 1;\nreturn value;",
  );
  await expect(codeButton).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "加粗", exact: true })).toBeDisabled();

  await placeCaretInRenderedText(page, "[0,0]", 16);
  await page.keyboard.press("Enter");
  await page.keyboard.type("console.log(value);");

  await expect(editor.locator("pre code")).toContainText(
    "const value = 1;\nconsole.log(value);",
  );

  await placeCaretInRenderedText(page, "[0,0]", 50);
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");

  await expect(editor.locator("pre")).toHaveCount(1);
  await expect(editor.locator("p")).toHaveCount(2);
  await expect(page.getByLabel("模型校验状态")).toContainText("合法");
});

test("toggles a paragraph code block from the demo control", async ({ page }) => {
  await page.goto("/");

  const editor = page.getByLabel("已渲染文档");
  const codeButton = page.getByRole("button", { name: "代码块", exact: true });

  await codeButton.click();
  await expect(editor.locator('pre[data-crucialy-path="[0]"]')).toHaveCount(1);
  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"type": "codeBlock"',
  );

  await codeButton.click();
  await expect(editor.locator('p[data-crucialy-path="[0]"]')).toHaveCount(1);
  await expect(page.getByLabel("文档 JSON", { exact: true })).toContainText(
    '"type": "paragraph"',
  );
});

test("renders the code block and divider acceptance sample", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("code-divider");

  const editor = page.getByLabel("已渲染文档");

  await expect(editor.locator('pre[data-crucialy-path="[0]"] code')).toHaveText(
    "const total = 3;\nreturn total;",
  );
  await expect(editor.locator('hr[data-crucialy-path="[1]"]')).toHaveCount(1);
  await expect(editor.locator('p[data-crucialy-path="[2]"]')).toHaveText(
    "分隔线后可以继续编辑正文。",
  );
  await expect(page.getByLabel("模型校验状态")).toContainText("合法");
});

test("renders the ordered and unordered list sample", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("lists");

  const editor = page.getByLabel("已渲染文档");

  await expect(editor.locator('ul[data-crucialy-path="[0]"] > li')).toHaveCount(2);
  await expect(editor.locator('ol[data-crucialy-path="[1]"] > li')).toHaveCount(2);
  await expect(editor.locator('[data-crucialy-path="[0,0,0]"]')).toHaveText(
    "无序列表第一项",
  );
  await expect(page.getByLabel("模型校验状态")).toContainText("合法");
});

test("switches paragraphs between ordered and unordered lists", async ({ page }) => {
  await page.goto("/");
  await setDebuggerSelection(page, "0,0", 0, 2);

  const editor = page.getByLabel("已渲染文档");

  await page.getByRole("button", { name: "无序列表", exact: true }).click();
  await expect(editor.locator('ul[data-crucialy-path="[0]"]')).toHaveCount(1);
  await expect(page.getByLabel("锚点路径")).toHaveValue("0,0,0");

  await page.getByRole("button", { name: "有序列表", exact: true }).click();
  await expect(editor.locator('ol[data-crucialy-path="[0]"]')).toHaveCount(1);
  await expect(editor.locator("ul")).toHaveCount(0);

  await page.getByRole("button", { name: "有序列表", exact: true }).click();
  await expect(editor.locator('p[data-crucialy-path="[0]"]')).toHaveText(
    "你好，crucialy-rich。",
  );
});

test("splits and exits list items with Enter", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("lists");

  const editor = page.getByLabel("已渲染文档");
  const firstItem = editor.locator('ul[data-crucialy-path="[0]"] > li');

  await placeCaretInRenderedText(page, "[0,0,0]", 4);
  await page.keyboard.press("Enter");
  await expect(firstItem).toHaveCount(3);
  await expect(editor.locator('[data-crucialy-path="[0,1,0]"]')).toHaveText("第一项");

  await placeCaretInRenderedText(page, "[0,2,0]", 7);
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");

  await expect(editor.locator('p[data-crucialy-path="[1]"]')).toHaveCount(1);
  await expect(page.getByLabel("模型校验状态")).toContainText("合法");
});

test("indents and outdents list items with Tab", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("advanced-lists");

  const editor = page.getByLabel("已渲染文档");

  await placeCaretInRenderedText(page, "[0,1,0]", 0);
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    "indent_list_item",
  );
  await expect(editor.locator('[data-crucialy-path="[0,0,1,1,0]"]')).toHaveText(
    "可缩进项目",
  );

  await page.keyboard.press("Shift+Tab");
  await expect(editor.locator('[data-crucialy-path="[0,1,0]"]')).toHaveText(
    "可缩进项目",
  );
  await expect(page.getByLabel("模型校验状态")).toContainText("合法");
});

test("outdents a nested list item with Backspace", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("advanced-lists");

  const editor = page.getByLabel("已渲染文档");

  await placeCaretInRenderedText(page, "[0,0,1,0,0]", 0);
  await page.keyboard.press("Backspace");
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    "outdent_list_item",
  );

  await expect(editor.locator('[data-crucialy-path="[0,1,0]"]')).toHaveText("已有子项");
  await expect(page.getByLabel("模型校验状态")).toContainText("合法");
});

test("toggles and restores task item state", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("advanced-lists");

  const editor = page.getByLabel("已渲染文档");
  const taskItem = editor.getByRole("listitem").filter({
    hasText: "编写列表测试",
  });
  const checkbox = taskItem.getByRole("checkbox", { name: "标记任务为已完成" });

  await expect(checkbox).not.toBeChecked();
  await checkbox.click();
  await expect(
    taskItem.getByRole("checkbox", { name: "标记任务为未完成" }),
  ).toBeChecked();

  await page.getByRole("button", { name: "撤销", exact: true }).click();
  await expect(
    taskItem.getByRole("checkbox", { name: "标记任务为已完成" }),
  ).not.toBeChecked();
  await expect(page.getByLabel("模型校验状态")).toContainText("合法");
});

test("inserts a divider and restores it through history", async ({ page }) => {
  await page.goto("/");
  await setDebuggerSelection(page, "0,0", 3, 3);

  const editor = page.getByLabel("已渲染文档");
  const dividerButton = page.getByRole("button", {
    name: "分隔线",
    exact: true,
  });

  await expect(dividerButton).toBeEnabled();
  await dividerButton.click();

  await expect(editor.locator('p[data-crucialy-path="[0]"]')).toHaveText("你好，");
  await expect(editor.locator('hr[data-crucialy-path="[1]"]')).toHaveCount(1);
  await expect(editor.locator('p[data-crucialy-path="[2]"]')).toHaveText(
    "crucialy-rich。",
  );
  await expect(page.getByLabel("锚点路径")).toHaveValue("2,0");
  await expect(page.getByLabel("锚点偏移")).toHaveValue("0");
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    '"type": "insert_block"',
  );

  await page.getByRole("button", { name: "撤销", exact: true }).click();
  await expect(editor.locator("hr")).toHaveCount(0);
  await expect(editor.locator('p[data-crucialy-path="[0]"]')).toHaveText(
    "你好，crucialy-rich。",
  );

  await page.getByRole("button", { name: "重做", exact: true }).click();
  await expect(editor.locator('hr[data-crucialy-path="[1]"]')).toHaveCount(1);

  await placeCaretInRenderedText(page, "[2,0]", 0);
  await page.keyboard.type("继续");
  await expect(editor.locator('p[data-crucialy-path="[2]"]')).toHaveText(
    "继续crucialy-rich。",
  );
});

test("deletes a divider from both adjacent text boundaries", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("code-divider");

  const editor = page.getByLabel("已渲染文档");
  const code = editor.locator('code[data-crucialy-path="[0,0]"]');
  const codeLength = (await code.textContent())?.length ?? 0;

  await placeCaretInRenderedText(page, "[0,0]", codeLength);
  await page.keyboard.press("Delete");
  await expect(editor.locator("hr")).toHaveCount(0);
  await expect(editor.locator('p[data-crucialy-path="[1]"]')).toHaveText(
    "分隔线后可以继续编辑正文。",
  );

  await page.getByLabel("模型示例").selectOption("regular");
  await page.getByLabel("模型示例").selectOption("code-divider");
  await placeCaretInRenderedText(page, "[2,0]", 0);
  await page.keyboard.press("Backspace");

  await expect(editor.locator("hr")).toHaveCount(0);
  await expect(editor.locator('p[data-crucialy-path="[1]"]')).toHaveText(
    "分隔线后可以继续编辑正文。",
  );
  await expect(page.getByLabel("锚点路径")).toHaveValue("1,0");
  await expect(page.getByLabel("模型校验状态")).toContainText("合法");
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
  await expect(page.getByLabel("标题层级")).toHaveValue("mixed");
  await expect(page.getByRole("button", { name: "引用", exact: true })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});

test("restores the selected mixed blocks to paragraphs", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("block-types");

  const headingSelect = page.getByLabel("标题层级");
  const renderedDocument = page.getByLabel("已渲染文档");

  await expect(headingSelect).toHaveValue("mixed");
  await headingSelect.selectOption("paragraph");

  await expect(renderedDocument.locator("h2")).toHaveCount(0);
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
  await expect(renderedDocument.locator('p[data-crucialy-path="[3]"]')).toHaveText(
    "未选中的结尾段落保持原样。",
  );
  await expect(headingSelect).toHaveValue("paragraph");
  await expect(page.getByLabel("模型校验状态")).toContainText("合法");
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

test("exits an empty quote on Enter and continues in a paragraph", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("quotes");

  const renderedDocument = page.getByLabel("已渲染文档");

  await placeCaretInRenderedText(page, "[0,0]", 4);
  await page.keyboard.press("Enter");
  await expect(renderedDocument.locator("blockquote")).toHaveCount(2);

  await page.keyboard.press("Enter");
  await expect(renderedDocument.locator("blockquote")).toHaveCount(1);
  await expect(renderedDocument.locator('p[data-crucialy-path="[1]"]')).toHaveCount(1);

  await page.keyboard.type("继续正文");
  await expect(renderedDocument.locator('p[data-crucialy-path="[1]"]')).toHaveText(
    "继续正文",
  );
  await expect(page.getByLabel("模型校验状态")).toContainText("合法");
});

test("restores selected quote exit through history", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("quotes");
  await selectRenderedTextRange(page, "[0,0]", 0, 4);
  await page.keyboard.press("Enter");

  const renderedDocument = page.getByLabel("已渲染文档");

  await expect(renderedDocument.locator("blockquote")).toHaveCount(0);
  await expect(renderedDocument.locator("p")).toHaveCount(2);
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');

  await page.getByRole("button", { name: "撤销", exact: true }).click();
  await expect(renderedDocument.locator("blockquote")).toHaveText("引用内容");

  await page.getByRole("button", { name: "重做", exact: true }).click();
  await expect(renderedDocument.locator("blockquote")).toHaveCount(0);
  await expect(renderedDocument.locator("p")).toHaveCount(2);
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
  await expect(page.getByLabel("分段 Command 状态")).toContainText("可用");
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

  await page.getByRole("button", { name: "加粗", exact: true }).click();

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

  await page.getByRole("button", { name: "斜体", exact: true }).click();

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
  const boldButton = page.getByRole("button", { name: "加粗", exact: true });
  const underlineButton = page.getByRole("button", {
    name: "下划线",
    exact: true,
  });

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
  const strikeButton = page.getByRole("button", { name: "删除线", exact: true });
  const underlineButton = page.getByRole("button", {
    name: "下划线",
    exact: true,
  });

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
  const boldButton = page.getByRole("button", { name: "加粗", exact: true });
  const italicButton = page.getByRole("button", { name: "斜体", exact: true });

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

test("replaces a cross-node text selection from editor input", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("marks");
  await selectRenderedTextAcrossNodes(page, "[1,0]", 1, "[1,4]", 2);

  await insertEditorText(page, "替换");

  await expect(page.getByLabel("已渲染文档").locator("p").nth(1)).toHaveText(
    "跨替换。",
  );
  await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
  await expect(page.getByLabel("选区 JSON")).toContainText('"offset": 3');
});

test("splits after deleting a cross-node selection with Enter", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("marks");
  await selectRenderedTextAcrossNodes(page, "[1,0]", 1, "[1,4]", 2);

  await page.keyboard.press("Enter");

  const paragraphs = page.getByLabel("已渲染文档").locator("p");
  await expect(paragraphs).toHaveCount(3);
  await expect(paragraphs.nth(1)).toHaveText("跨");
  await expect(paragraphs.nth(2)).toHaveText("。");
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    '"type": "delete_text"',
  );
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    '"type": "split_block"',
  );
  await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
});

for (const key of ["Backspace", "Delete"] as const) {
  test(`deletes a cross-node text selection with ${key}`, async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("模型示例").selectOption("marks");
    await selectRenderedTextAcrossNodes(page, "[1,0]", 1, "[1,4]", 2);

    await page.keyboard.press(key);

    await expect(page.getByLabel("已渲染文档").locator("p").nth(1)).toHaveText("跨。");
    await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
    await expect(page.getByLabel("选区 JSON")).toContainText('"offset": 1');
  });
}

test("completes the underline and strike acceptance loop", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("marks");

  const renderedDocument = page.getByLabel("已渲染文档");
  const acceptanceParagraph = renderedDocument.locator("p").nth(1);
  const underlineButton = page.getByRole("button", {
    name: "下划线",
    exact: true,
  });
  const strikeButton = page.getByRole("button", { name: "删除线", exact: true });

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

test("creates one link across text blocks", async ({ page }) => {
  await page.goto("/");
  await selectRenderedTextAcrossNodes(page, "[0,0]", 3, "[1,0]", 2);

  await page.getByRole("button", { name: "链接", exact: true }).click();
  await page.getByLabel("链接地址").fill("https://example.com/cross-block");
  await page.getByRole("button", { name: "确认链接" }).click();

  const editor = page.getByLabel("已渲染文档");
  const links = editor.getByRole("link");

  await expect(links).toHaveCount(2);
  await expect(links.first()).toHaveText("crucialy-rich。");
  await expect(links.last()).toHaveText("选区");
  await expect(links.first()).toHaveAttribute(
    "href",
    "https://example.com/cross-block",
  );
  await expect(links.last()).toHaveAttribute("href", "https://example.com/cross-block");
  await expect(page.getByLabel("选中链接状态")).toContainText(
    "https://example.com/cross-block",
  );
  await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
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

test("sets text attributes across text blocks", async ({ page }) => {
  await page.goto("/");
  await selectRenderedTextAcrossNodes(page, "[0,0]", 3, "[1,0]", 2);

  const editor = page.getByLabel("已渲染文档");
  const fontSizeSelect = page.getByLabel("字号", { exact: true });
  const textColorInput = page.getByLabel("文字颜色", { exact: true });

  await fontSizeSelect.selectOption("24");
  await expect(editor.locator('[data-crucialy-path="[0,1]"]')).toHaveCSS(
    "font-size",
    "24px",
  );
  await expect(editor.locator('[data-crucialy-path="[1,0]"]')).toHaveCSS(
    "font-size",
    "24px",
  );

  await textColorInput.fill("#52c41a");
  await expect(editor.locator('[data-crucialy-path="[0,1]"]')).toHaveCSS(
    "color",
    "rgb(82, 196, 26)",
  );
  await expect(editor.locator('[data-crucialy-path="[1,0]"]')).toHaveCSS(
    "color",
    "rgb(82, 196, 26)",
  );
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    '"attribute": "textColor"',
  );
  await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
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
  await page.getByRole("button", { name: "插入", exact: true }).click();

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
  await page.getByRole("button", { name: "插入", exact: true }).click();

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

test("replaces a cross-block selection from editor input", async ({ page }) => {
  await page.goto("/");
  await selectRenderedTextAcrossNodes(page, "[0,0]", 3, "[1,0]", 2);

  await insertEditorText(page, "跨");

  const editor = page.getByLabel("已渲染文档");
  await expect(editor.locator("p")).toHaveCount(1);
  await expect(editor.locator("p")).toHaveText("你好，跨模型已就绪。");
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    '"type": "delete_range"',
  );
  await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
});

test("splits after deleting a cross-block selection with Enter", async ({ page }) => {
  await page.goto("/");
  await selectRenderedTextAcrossNodes(page, "[0,0]", 3, "[1,0]", 2);

  await page.keyboard.press("Enter");

  const paragraphs = page.getByLabel("已渲染文档").locator("p");
  await expect(paragraphs).toHaveCount(2);
  await expect(paragraphs.first()).toHaveText("你好，");
  await expect(paragraphs.nth(1)).toHaveText("模型已就绪。");
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    '"type": "delete_range"',
  );
  await expect(page.getByLabel("最近 Transaction", { exact: true })).toContainText(
    '"type": "split_block"',
  );
  await expect(page.getByLabel("选区 JSON")).toContainText('"path": [');
  await expect(page.getByLabel("锚点路径")).toHaveValue("1,0");
  await expect(page.getByLabel("锚点偏移")).toHaveValue("0");
  await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
});

for (const key of ["Backspace", "Delete"] as const) {
  test(`deletes a cross-block selection with ${key}`, async ({ page }) => {
    await page.goto("/");
    await selectRenderedTextAcrossNodes(page, "[0,0]", 3, "[1,0]", 2);

    await page.keyboard.press(key);

    const editor = page.getByLabel("已渲染文档");
    await expect(editor.locator("p")).toHaveCount(1);
    await expect(editor.locator("p")).toHaveText("你好，模型已就绪。");
    await expect(page.getByLabel("选区 JSON")).toContainText('"offset": 3');
    await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
  });
}

test("restores cross-block replacement through history", async ({ page }) => {
  await page.goto("/");
  await selectRenderedTextAcrossNodes(page, "[0,0]", 3, "[1,0]", 2);
  await insertEditorText(page, "跨");

  const editor = page.getByLabel("已渲染文档");
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');

  await page.getByRole("button", { name: "撤销", exact: true }).click();
  await expect(editor.locator("p")).toHaveCount(2);
  await expect(editor.locator("p").first()).toHaveText("你好，crucialy-rich。");
  await expect(editor.locator("p").nth(1)).toHaveText("选区模型已就绪。");

  await page.getByRole("button", { name: "重做", exact: true }).click();
  await expect(editor.locator("p")).toHaveCount(1);
  await expect(editor.locator("p")).toHaveText("你好，跨模型已就绪。");
  await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
});

test("restores selected Enter through history", async ({ page }) => {
  await page.goto("/");
  await selectRenderedTextAcrossNodes(page, "[0,0]", 3, "[1,0]", 2);
  await page.keyboard.press("Enter");

  const editor = page.getByLabel("已渲染文档");
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');

  await page.getByRole("button", { name: "撤销", exact: true }).click();
  await expect(editor.locator("p")).toHaveCount(2);
  await expect(editor.locator("p").first()).toHaveText("你好，crucialy-rich。");
  await expect(editor.locator("p").nth(1)).toHaveText("选区模型已就绪。");

  await page.getByRole("button", { name: "重做", exact: true }).click();
  await expect(editor.locator("p").first()).toHaveText("你好，");
  await expect(editor.locator("p").nth(1)).toHaveText("模型已就绪。");
  await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
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

test("inserts, selects, and deletes image blocks", async ({ page }) => {
  await page.goto("/");

  const editor = page.getByLabel("已渲染文档");
  const documentJson = page.getByLabel("文档 JSON", { exact: true });

  await setDebuggerSelection(page, "0,0", 3, 3);
  await page.getByLabel("图片地址").fill("https://example.com/cover.png");
  await page.getByRole("button", { name: "插入网络图片" }).click();

  const remoteImage = editor.locator('img[alt="网络图片"]');

  await expect(remoteImage).toHaveAttribute("src", "https://example.com/cover.png");
  await expect(documentJson).toContainText('"type": "image"');
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');

  await remoteImage.click({ force: true });
  await expect(remoteImage).toHaveAttribute("data-selected", "true");
  await editor.press("Delete");

  await expect(remoteImage).toHaveCount(0);
  await expect(documentJson).not.toContainText('"type": "image"');
  await expect(page.getByLabel("选区 JSON")).toContainText('"path": [');

  await page.getByLabel("选择本地图片").setInputFiles({
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    ),
    mimeType: "image/png",
    name: "本地封面.png",
  });

  const localImage = editor.locator('img[alt="本地封面.png"]');

  await expect(localImage).toHaveAttribute("src", /^blob:/);
  await expect(documentJson).toContainText('"src": "blob:');
  await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
});

test("pastes plain text through the native editor event", async ({ page }) => {
  await page.goto("/");
  await placeCaretInRenderedText(page, "[0,0]", 3);

  await page.getByLabel("已渲染文档").evaluate((editor) => {
    const clipboardData = new DataTransfer();

    clipboardData.setData("text/plain", "第一行\n第二行");
    editor.dispatchEvent(
      new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData,
      }),
    );
  });

  await expect(page.getByLabel("已渲染文档")).toContainText("你好，第一行");
  await expect(page.getByLabel("已渲染文档")).toContainText("第二行crucialy-rich。");
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
  await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
});

test("pastes HTML and Markdown from the acceptance controls", async ({ page }) => {
  await page.goto("/");
  const editor = page.getByLabel("已渲染文档");

  await setDebuggerSelection(page, "0,0", 3, 3);
  await page.getByLabel("粘贴格式").selectOption("text/html");
  await page.getByRole("button", { name: "粘贴示例" }).click();

  await expect(editor.locator("strong")).toContainText("HTML 加粗");
  await expect(editor.locator("ul li")).toContainText("HTML 列表");

  await page.getByLabel("模型示例").selectOption("regular");
  await setDebuggerSelection(page, "0,0", 3, 3);
  await page.getByLabel("粘贴格式").selectOption("text/markdown");
  await page.getByRole("button", { name: "粘贴示例" }).click();

  await expect(editor.getByRole("heading", { level: 2 })).toContainText(
    "Markdown 标题",
  );
  await expect(editor.locator("blockquote")).toContainText("Markdown 引用");
  await expect(editor.locator("strong")).toContainText("Markdown 加粗");
  await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
});

test("inserts and reshapes a basic table from the acceptance controls", async ({
  page,
}) => {
  await page.goto("/");
  const editor = page.getByLabel("已渲染文档");

  await setDebuggerSelection(page, "0,0", 1, 1);
  await page.getByRole("button", { name: "插入 3×3 表格" }).click();

  await expect(editor.locator("table")).toHaveCount(1);
  await expect(editor.locator("table tr")).toHaveCount(3);
  await expect(editor.locator("table td")).toHaveCount(9);

  await page.getByRole("button", { name: "首行后添加" }).click();
  await expect(editor.locator("table tr")).toHaveCount(4);
  await page.getByRole("button", { name: "删除首行" }).click();
  await expect(editor.locator("table tr")).toHaveCount(3);

  await page.getByRole("button", { name: "首列后添加" }).click();
  await expect(editor.locator("table td")).toHaveCount(12);
  await page.getByRole("button", { name: "删除首列" }).click();
  await expect(editor.locator("table td")).toHaveCount(9);

  await page.getByRole("button", { name: "删除表格" }).click();
  await expect(editor.locator("table")).toHaveCount(0);
  await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
});

test("edits selects and pastes TSV into table cells", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("tables");

  const editor = page.getByLabel("已渲染文档");
  const cells = editor.locator('td[data-crucialy-table-cell="true"]');
  const firstCell = cells.nth(0);

  await firstCell.click();
  await expect(firstCell).toHaveAttribute("data-selected", "true");
  await expect(page.getByLabel("当前单元格路径")).toHaveText("当前单元格：0 → 0 → 0");

  await firstCell.locator("p").click();
  await page.keyboard.press("End");
  await page.keyboard.type("项");
  await expect(firstCell).toContainText("姓名项");

  await page.keyboard.press("Enter");
  await expect(firstCell.locator("p")).toHaveCount(2);
  await page.keyboard.press("Backspace");
  await expect(firstCell.locator("p")).toHaveCount(1);
  await expect(firstCell).toContainText("姓名项");

  await firstCell.click();
  await page.getByRole("button", { name: "载入 TSV 示例" }).click();
  await page.getByRole("button", { name: "粘贴示例" }).click();

  await expect(cells.nth(0)).toHaveText("小明");
  await expect(cells.nth(1)).toHaveText("开发");
  await expect(cells.nth(3)).toHaveText("小红");
  await expect(cells.nth(4)).toHaveText("设计");
  await expect(cells).toHaveCount(9);
  await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
});

test("commits Chinese composition once after candidate updates", async ({ page }) => {
  await page.goto("/");
  await placeCaretInRenderedText(page, "[0,0]", 3);

  const editor = page.getByLabel("已渲染文档");

  await editor.evaluate((element) => {
    element.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true, data: "" }),
    );
    element.dispatchEvent(
      new CompositionEvent("compositionupdate", { bubbles: true, data: "中文" }),
    );
    element.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        isComposing: true,
        key: "Backspace",
      }),
    );
    element.dispatchEvent(
      new CompositionEvent("compositionupdate", { bubbles: true, data: "中" }),
    );
    element.dispatchEvent(
      new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        data: "中",
        inputType: "insertCompositionText",
        isComposing: true,
      }),
    );
    element.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true, data: "中文" }),
    );
  });

  await expect(editor).toContainText("你好，中文crucialy-rich。");
  await expect(editor).toHaveAttribute("data-composing", "false");
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
  await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
});
