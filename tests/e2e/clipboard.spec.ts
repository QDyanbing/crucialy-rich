import { expect, test, type Page } from "@playwright/test";

async function mockImageClipboard(page: Page) {
  await page.route("https://images.unsplash.com/**", (route) =>
    route.fulfill({
      contentType: "image/png",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        "base64",
      ),
    }),
  );
}

async function selectText(
  page: Page,
  anchorPath: string,
  anchorOffset: number,
  focusPath = anchorPath,
  focusOffset = anchorOffset,
  label = "已渲染文档",
) {
  await page.getByLabel(label).evaluate(
    (editor, points) => {
      const anchor = editor.querySelector(
        `[data-crucialy-path="${points.anchorPath}"]`,
      )!.firstChild!;
      const focus = editor.querySelector(
        `[data-crucialy-path="${points.focusPath}"]`,
      )!.firstChild!;
      (editor as HTMLElement).focus();
      window
        .getSelection()!
        .setBaseAndExtent(anchor, points.anchorOffset, focus, points.focusOffset);
      editor.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    },
    { anchorPath, anchorOffset, focusPath, focusOffset },
  );
}

async function dispatchClipboard(
  page: Page,
  type: "copy" | "cut",
  label = "已渲染文档",
  includeHtml = false,
) {
  return page.getByLabel(label).evaluate(
    (editor, options) => {
      const clipboardData = new DataTransfer();
      const event = new ClipboardEvent(options.type, {
        bubbles: true,
        cancelable: true,
        clipboardData,
      });
      editor.dispatchEvent(event);
      return {
        prevented: event.defaultPrevented,
        text: clipboardData.getData("text/plain"),
        types: Array.from(clipboardData.types),
        ...(options.includeHtml ? { html: clipboardData.getData("text/html") } : {}),
      };
    },
    { type, includeHtml },
  );
}

async function pasteCopiedToRegular(
  page: Page,
  copied: { text: string; html?: string },
) {
  await page.getByLabel("模型示例").selectOption("regular");
  const editor = page.getByLabel("已渲染文档");
  const length = (await editor.locator('[data-crucialy-path="[0,0]"]').textContent())!
    .length;
  await selectText(page, "[0,0]", 0, "[0,0]", length);
  await editor.evaluate((element, data) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData("text/plain", data.text);
    if (data.html) clipboardData.setData("text/html", data.html);
    element.dispatchEvent(
      new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData }),
    );
  }, copied);
}

test("copies a backward model selection without changing history", async ({ page }) => {
  await page.goto("/");
  const json = page.getByLabel("文档 JSON", { exact: true });
  const before = await json.textContent();
  await selectText(page, "[0,0]", 3, "[0,0]", 0);
  expect(await dispatchClipboard(page, "copy")).toEqual({
    prevented: true,
    text: "你好，",
    types: ["text/plain"],
  });
  await expect(json).toHaveText(before!);
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
  await expect(page.getByLabel("锚点偏移")).toHaveValue("3");
  await expect(page.getByLabel("焦点偏移")).toHaveValue("0");
});

test("keeps copied task states through paste undo and redo", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("list-clipboard");
  await page.getByLabel("复制格式").selectOption("html");
  await selectText(page, "[2,1,0]", 0, "[2,2,0]", 4);
  const copied = await dispatchClipboard(page, "copy", "已渲染文档", true);
  expect(copied.text).toBe("完成任务\n待办任务");
  expect(copied.html).not.toMatch(/未选任务|data-|aria-/);
  await pasteCopiedToRegular(page, copied);
  const editor = page.getByLabel("已渲染文档");
  const tasks = editor.locator('input[type="checkbox"]');
  await expect(tasks).toHaveCount(2);
  await expect(tasks.nth(0)).toBeChecked();
  await expect(tasks.nth(1)).not.toBeChecked();
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
  await page.getByRole("button", { name: "撤销", exact: true }).click();
  await expect(tasks).toHaveCount(0);
  await page.getByRole("button", { name: "重做", exact: true }).click();
  await expect(tasks).toHaveCount(2);
  await expect(tasks.nth(0)).toBeChecked();
  await expect(tasks.nth(1)).not.toBeChecked();
  await editor.screenshot({ path: test.info().outputPath("task-list-clipboard.png") });
  await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
});

test("does not cut sibling list items even after successful HTML copy", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("list-clipboard");
  await page.getByLabel("复制格式").selectOption("html");
  const json = page.getByLabel("文档 JSON", { exact: true });
  const before = await json.textContent();
  await selectText(page, "[0,1,0]", 1, "[0,2,0]", 1);
  expect((await dispatchClipboard(page, "copy", "已渲染文档", true)).html).toContain(
    "<ul>",
  );
  const cut = await dispatchClipboard(page, "cut", "已渲染文档", true);
  expect(cut.prevented).toBe(true);
  expect(cut.types).toEqual([]);
  expect(cut.html).toBe("");
  await expect(json).toHaveText(before!);
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
});

test("keeps plain list copy and cross-level HTML fallback complete", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("list-clipboard");
  await selectText(page, "[0,1,0]", 1, "[0,2,0]", 1);
  const plain = await dispatchClipboard(page, "copy", "已渲染文档", true);
  expect(plain.types).toEqual(["text/plain"]);
  expect(plain.text).toBe("甲\n子项甲\n子项乙\n乙");
  await page.getByLabel("复制格式").selectOption("html");
  await selectText(page, "[0,1,0]", 0, "[0,1,1,1,0]", 3);
  const fallback = await dispatchClipboard(page, "copy", "已渲染文档", true);
  expect(fallback.types).toEqual(["text/plain"]);
  expect(fallback.text).toBe("前甲\n子项甲\n子项乙");
  expect(fallback.html).toBe("");
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
});

test("copies paragraph boundaries as plain newlines", async ({ page }) => {
  await page.goto("/");
  await selectText(page, "[0,0]", 3, "[1,0]", 2);
  expect(await dispatchClipboard(page, "copy")).toEqual({
    prevented: true,
    text: "crucialy-rich。\n选区",
    types: ["text/plain"],
  });
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
});

test("copies sibling bullet items with selected nested lists and pastes their structure", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("list-clipboard");
  await page.getByLabel("复制格式").selectOption("html");
  await selectText(page, "[0,1,0]", 1, "[0,2,0]", 1);
  const copied = await dispatchClipboard(page, "copy", "已渲染文档", true);
  expect(copied.text).toBe("甲\n子项甲\n子项乙\n乙");
  expect(copied.html).toContain('<ol start="3">');
  expect(copied.html).not.toMatch(/未选|data-|aria-/);
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
  await pasteCopiedToRegular(page, copied);
  const editor = page.getByLabel("已渲染文档");
  await expect(editor.locator("ul > li")).toHaveCount(2);
  await expect(editor.locator("ol")).toHaveAttribute("start", "3");
  await expect(editor.locator("ol > li")).toHaveText(["子项甲", "子项乙"]);
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
  await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
});

test("copies ordered sibling items with their visible start number", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("list-clipboard");
  await page.getByLabel("复制格式").selectOption("html");
  await selectText(page, "[1,1,0]", 0, "[1,2,0]", 3);
  const copied = await dispatchClipboard(page, "copy", "已渲染文档", true);
  expect(copied.html).toContain('<ol start="6">');
  expect(copied.text).toBe("编号甲\n编号乙");
  await pasteCopiedToRegular(page, copied);
  await expect(page.getByLabel("已渲染文档").locator("ol")).toHaveAttribute(
    "start",
    "6",
  );
  await expect(page.getByLabel("已渲染文档").locator("ol > li")).toHaveText([
    "编号甲",
    "编号乙",
  ]);
  await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
});

test("copies nested siblings without including their parent list entry", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("list-clipboard");
  await page.getByLabel("复制格式").selectOption("html");
  await selectText(page, "[0,1,1,0,0]", 0, "[0,1,1,1,0]", 3);
  const copied = await dispatchClipboard(page, "copy", "已渲染文档", true);
  expect(copied.html).toMatch(/^<ol start="3">/);
  expect(copied.html).not.toMatch(/前甲|未选|<ul/);
  expect(copied.text).toBe("子项甲\n子项乙");
  await pasteCopiedToRegular(page, copied);
  await expect(page.getByLabel("已渲染文档").locator("ol > li")).toHaveText([
    "子项甲",
    "子项乙",
  ]);
  await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
});

test("copies readonly link text without exporting HTML or href", async ({ page }) => {
  await page.goto("/");
  const label = "只读态链接示例";
  const editor = page.getByLabel(label);
  const before = await editor.textContent();
  const link = editor.locator("a").first();
  const path = (await link.getAttribute("data-crucialy-path"))!;
  const text = (await link.textContent())!;
  await selectText(page, path, 0, path, text.length, label);
  expect(await dispatchClipboard(page, "copy", label)).toEqual({
    prevented: true,
    text,
    types: ["text/plain"],
  });
  await expect(editor).toHaveText(before!);
});

for (const backward of [false, true]) {
  test(`cuts model text and restores its range through history (backward: ${backward})`, async ({
    page,
  }) => {
    await page.goto("/");
    const json = page.getByLabel("文档 JSON", { exact: true });
    const initial = JSON.parse((await json.textContent())!);
    await selectText(page, "[0,0]", backward ? 3 : 0, "[0,0]", backward ? 0 : 3);
    expect(await dispatchClipboard(page, "cut")).toEqual({
      prevented: true,
      text: "你好，",
      types: ["text/plain"],
    });
    const cut = JSON.parse((await json.textContent())!);
    await expect(page.getByLabel("已渲染文档").locator("p").first()).toHaveText(
      "crucialy-rich。",
    );
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
    await page.getByRole("button", { name: "撤销", exact: true }).click();
    await expect
      .poll(async () => JSON.parse((await json.textContent())!))
      .toEqual(initial);
    await expect(page.getByLabel("锚点偏移")).toHaveValue(backward ? "3" : "0");
    await expect(page.getByLabel("焦点偏移")).toHaveValue(backward ? "0" : "3");
    await page.getByRole("button", { name: "重做", exact: true }).click();
    await expect.poll(async () => JSON.parse((await json.textContent())!)).toEqual(cut);
    await page.keyboard.insertText("续");
    await expect(page.getByLabel("已渲染文档").locator("p").first()).toHaveText(
      "续crucialy-rich。",
    );
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 2');
    await page.getByRole("button", { name: "撤销", exact: true }).click();
    await expect.poll(async () => JSON.parse((await json.textContent())!)).toEqual(cut);
    await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
  });
}

test("cuts a cross-paragraph selection as one undoable transaction", async ({
  page,
}) => {
  await page.goto("/");
  const json = page.getByLabel("文档 JSON", { exact: true });
  const initial = JSON.parse((await json.textContent())!);
  await selectText(page, "[0,0]", 3, "[1,0]", 2);
  expect((await dispatchClipboard(page, "cut")).text).toBe("crucialy-rich。\n选区");
  await expect(page.getByLabel("已渲染文档").locator("p")).toHaveText([
    "你好，模型已就绪。",
  ]);
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
  await page.getByRole("button", { name: "撤销", exact: true }).click();
  await expect
    .poll(async () => JSON.parse((await json.textContent())!))
    .toEqual(initial);
  await expect(page.getByLabel("锚点路径")).toHaveValue("0,0");
  await expect(page.getByLabel("焦点路径")).toHaveValue("1,0");
  await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
});

test("copies table separators but blocks cross-cell cut", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("tables");
  const json = page.getByLabel("文档 JSON", { exact: true });
  const initial = await json.textContent();
  await selectText(page, "[0,0,0,0,0]", 1, "[0,0,1,0,0]", 1);
  expect((await dispatchClipboard(page, "copy")).text).toBe("名\n同一单元格第二段\t角");
  expect(await dispatchClipboard(page, "cut")).toEqual({
    prevented: true,
    text: "",
    types: [],
  });
  await expect(json).toHaveText(initial!);
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
});

test("cuts a cell paragraph range without changing the neighboring cell", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("tables");
  const json = page.getByLabel("文档 JSON", { exact: true });
  const initial = JSON.parse((await json.textContent())!);
  await selectText(page, "[0,0,0,0,0]", 1, "[0,0,0,1,0]", 2);
  expect((await dispatchClipboard(page, "cut")).text).toBe("名\n同一");
  const cells = page.getByLabel("已渲染文档").locator("td");
  await expect(cells.first()).toHaveText("姓单元格第二段");
  await expect(cells.nth(1)).toHaveText("角色");
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
  await page.getByRole("button", { name: "撤销", exact: true }).click();
  await expect
    .poll(async () => JSON.parse((await json.textContent())!))
    .toEqual(initial);
  await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
});

test("round trips native clipboard shortcuts through copy cut and paste", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  const json = page.getByLabel("文档 JSON", { exact: true });
  const initial = JSON.parse((await json.textContent())!);
  await selectText(page, "[0,0]", 0, "[0,0]", 3);
  await page.keyboard.press("ControlOrMeta+C");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("你好，");
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
  await page.keyboard.press("ControlOrMeta+X");
  await expect(page.getByLabel("已渲染文档").locator("p").first()).toHaveText(
    "crucialy-rich。",
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("你好，");
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
  await page.keyboard.press("ControlOrMeta+V");
  await expect
    .poll(async () => JSON.parse((await json.textContent())!))
    .toEqual(initial);
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 2');
  await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
});

test("copies styled model text as HTML and pastes it back with formatting", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("marks");
  await page.getByLabel("复制格式").selectOption("html");
  await selectText(page, "[0,1]", 0, "[0,1]", 4);
  const copied = await dispatchClipboard(page, "copy", "已渲染文档", true);
  expect(copied.text).toBe("加粗文本");
  expect(copied.types).toEqual(["text/plain", "text/html"]);
  expect(copied.html).toBe("<p><strong>加粗文本</strong></p>");
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
  await page.getByLabel("模型示例").selectOption("regular");
  const editor = page.getByLabel("已渲染文档");
  const length = (await editor.locator('[data-crucialy-path="[0,0]"]').textContent())!
    .length;
  await selectText(page, "[0,0]", 0, "[0,0]", length);
  await editor.evaluate((element, data) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData("text/plain", data.text);
    clipboardData.setData("text/html", data.html!);
    element.dispatchEvent(
      new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData }),
    );
  }, copied);
  await expect(editor.locator("strong")).toHaveText("加粗文本");
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
  await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
  await page.screenshot({ path: test.info().outputPath("clipboard-desktop.png") });
});

test("switches HTML clipboard back to plain without editing the document", async ({
  page,
}) => {
  await page.goto("/");
  const json = page.getByLabel("文档 JSON", { exact: true });
  const before = await json.textContent();
  await page.getByLabel("复制格式").selectOption("html");
  await selectText(page, "[0,0]", 0, "[0,0]", 3);
  expect((await dispatchClipboard(page, "copy", "已渲染文档", true)).html).toContain(
    "你好，",
  );
  await page.getByLabel("复制格式").selectOption("plain");
  await selectText(page, "[0,0]", 0, "[0,0]", 3);
  const plain = await dispatchClipboard(page, "copy", "已渲染文档", true);
  expect(plain.types).toEqual(["text/plain"]);
  expect(plain.html).toBe("");
  await expect(json).toHaveText(before!);
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
});

test("keeps the Chinese clipboard format control usable on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const control = page.getByLabel("复制格式");
  await expect(control).toHaveValue("plain");
  await control.selectOption("html");
  await expect(control).toHaveValue("html");
  const bounds = (await control.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  await page.screenshot({ path: test.info().outputPath("clipboard-mobile.png") });
});

for (const backward of [false, true]) {
  test(`cuts HTML marks and restores the original range (backward: ${backward})`, async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByLabel("模型示例").selectOption("marks");
    await page.getByLabel("复制格式").selectOption("html");
    const json = page.getByLabel("文档 JSON", { exact: true });
    const before = JSON.parse((await json.textContent())!);
    await selectText(page, "[0,1]", backward ? 4 : 0, "[0,1]", backward ? 0 : 4);
    const cut = await dispatchClipboard(page, "cut", "已渲染文档", true);
    expect(cut.html).toBe("<p><strong>加粗文本</strong></p>");
    expect(cut.types).toEqual(["text/plain", "text/html"]);
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
    const deleted = JSON.parse((await json.textContent())!);
    await page.getByRole("button", { name: "撤销", exact: true }).click();
    await expect
      .poll(async () => JSON.parse((await json.textContent())!))
      .toEqual(before);
    await expect(page.getByLabel("锚点偏移")).toHaveValue(backward ? "4" : "0");
    await expect(page.getByLabel("焦点偏移")).toHaveValue(backward ? "0" : "4");
    await page.getByRole("button", { name: "重做", exact: true }).click();
    await expect
      .poll(async () => JSON.parse((await json.textContent())!))
      .toEqual(deleted);
    await page.keyboard.insertText("续");
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 2');
    await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
  });
}

test("copies same-row cells as a table in HTML mode", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("tables");
  await page.getByLabel("复制格式").selectOption("html");
  await selectText(page, "[0,0,0,0,0]", 1, "[0,0,1,0,0]", 1);
  const copied = await dispatchClipboard(page, "copy", "已渲染文档", true);
  expect(copied.text).toBe("名\n同一单元格第二段\t角");
  expect(copied.html).toContain("<table><tbody><tr><td>");
  expect(copied.types).toEqual(["text/plain", "text/html"]);
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
});

for (const backward of [false, true]) {
  test(`round trips a clipped same-row table fragment (backward: ${backward})`, async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByLabel("模型示例").selectOption("table-clipboard");
    await page.getByLabel("复制格式").selectOption("html");
    const json = page.getByLabel("文档 JSON", { exact: true });
    const before = await json.textContent();
    await selectText(
      page,
      backward ? "[0,0,2,0,0]" : "[0,0,1,1,0]",
      1,
      backward ? "[0,0,1,1,0]" : "[0,0,2,0,0]",
      1,
    );
    const copied = await dispatchClipboard(page, "copy", "已渲染文档", true);
    expect(copied.text).toBe("甲\n续段\t乙");
    expect(copied.html).toContain("<strong>甲</strong>");
    expect(copied.html).toContain("<em>乙</em>");
    expect(copied.html).not.toMatch(/未选|前|后|data-|aria-/);
    await expect(json).toHaveText(before!);
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
    await pasteCopiedToRegular(page, copied);
    const editor = page.getByLabel("已渲染文档");
    await expect(editor.locator("table tr")).toHaveCount(1);
    await expect(editor.locator("td")).toHaveText(["甲续段", "乙"]);
    await expect(editor.locator("td strong")).toHaveText("甲");
    await expect(editor.locator("td em")).toHaveText("乙");
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
    await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
    if (!backward)
      await editor.screenshot({
        path: test.info().outputPath("table-clipboard-desktop.png"),
      });
  });
}

for (const backward of [false, true]) {
  test(`preserves complete copied table rows through undo and redo (backward: ${backward})`, async ({
    page,
  }) => {
    if (backward) await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const json = page.getByLabel("文档 JSON", { exact: true });
    const regular = JSON.parse((await json.textContent())!);
    await page.getByLabel("模型示例").selectOption("table-clipboard");
    await page.getByLabel("复制格式").selectOption("html");
    const before = await json.textContent();
    await selectText(
      page,
      backward ? "[0,2,2,0,0]" : "[0,1,0,0,0]",
      backward ? 2 : 0,
      backward ? "[0,1,0,0,0]" : "[0,2,2,0,0]",
      backward ? 0 : 2,
    );
    const copied = await dispatchClipboard(page, "copy", "已渲染文档", true);
    expect(copied.text).toBe("甲一\t甲二\t甲三\n乙一\t乙二\t乙三");
    expect(copied.html).not.toMatch(/未选|续段|data-|aria-/);
    const cut = await dispatchClipboard(page, "cut", "已渲染文档", true);
    expect(cut.prevented).toBe(true);
    expect(cut.types).toEqual([]);
    await expect(json).toHaveText(before!);
    await pasteCopiedToRegular(page, copied);
    const editor = page.getByLabel("已渲染文档");
    await expect(editor.locator("table tr")).toHaveCount(2);
    await expect(editor.locator("td")).toHaveText([
      "甲一",
      "甲二",
      "甲三",
      "乙一",
      "乙二",
      "乙三",
    ]);
    const pasted = JSON.parse((await json.textContent())!);
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
    await page.getByRole("button", { name: "撤销", exact: true }).click();
    await expect
      .poll(async () => JSON.parse((await json.textContent())!))
      .toEqual(regular);
    await expect(editor.locator("table")).toHaveCount(0);
    await page.getByRole("button", { name: "重做", exact: true }).click();
    await expect
      .poll(async () => JSON.parse((await json.textContent())!))
      .toEqual(pasted);
    await expect(editor.locator("td")).toHaveCount(6);
    await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
    if (backward) {
      const bounds = (await editor.locator("table").boundingBox())!;
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
      await editor.screenshot({
        path: test.info().outputPath("table-clipboard-mobile.png"),
      });
    }
  });
}

test("keeps partial multi-row table copy plain and blocks native cut", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("table-clipboard");
  const json = page.getByLabel("文档 JSON", { exact: true });
  const before = await json.textContent();
  await page.getByLabel("复制格式").selectOption("html");
  await selectText(page, "[0,1,1,0,0]", 1, "[0,2,1,0,0]", 1);
  const copied = await dispatchClipboard(page, "copy", "已渲染文档", true);
  expect(copied.types).toEqual(["text/plain"]);
  expect(copied.text).toBe("二\t甲三\n乙一\t乙");
  expect(copied.html).toBe("");
  const cut = await dispatchClipboard(page, "cut", "已渲染文档", true);
  expect(cut.prevented).toBe(true);
  expect(cut.types).toEqual([]);
  await expect(json).toHaveText(before!);
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
  await page.getByLabel("复制格式").selectOption("plain");
  await selectText(page, "[0,1,0,0,0]", 0, "[0,2,2,0,0]", 2);
  const plain = await dispatchClipboard(page, "copy", "已渲染文档", true);
  expect(plain.types).toEqual(["text/plain"]);
  expect(plain.text).toBe("甲一\t甲二\t甲三\n乙一\t乙二\t乙三");
});

for (const backward of [false, true]) {
  test(`round trips a mixed clipboard fragment with one history entry (backward: ${backward})`, async ({
    page,
  }) => {
    if (backward) await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const json = page.getByLabel("文档 JSON", { exact: true });
    const regular = JSON.parse((await json.textContent())!);
    await page.getByLabel("模型示例").selectOption("mixed-clipboard");
    await page.getByLabel("复制格式").selectOption("html");
    const source = await json.textContent();
    await selectText(
      page,
      backward ? "[6,0]" : "[1,0]",
      1,
      backward ? "[1,0]" : "[6,0]",
      1,
    );
    const copied = await dispatchClipboard(page, "copy", "已渲染文档", true);
    expect(copied.types).toEqual(["text/plain", "text/html"]);
    expect(copied.text).toBe(
      "甲\n编号甲\n编号乙\n表格甲\t表格乙\n\n完成任务\n待办任务\n乙",
    );
    expect(copied.html).not.toMatch(/未选|data-|aria-|contenteditable/);
    await expect(json).toHaveText(source!);
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
    await pasteCopiedToRegular(page, copied);
    const editor = page.getByLabel("已渲染文档");
    await expect(editor.locator("h2")).toHaveText("甲");
    await expect(editor.locator("ol")).toHaveAttribute("start", "5");
    await expect(editor.locator("ol > li")).toHaveText(["编号甲", "编号乙"]);
    await expect(editor.locator("td")).toHaveText(["表格甲", "表格乙"]);
    await expect(editor.locator("hr")).toHaveCount(1);
    await expect(editor.locator('input[type="checkbox"]').nth(0)).toBeChecked();
    await expect(editor.locator('input[type="checkbox"]').nth(1)).not.toBeChecked();
    await expect(editor.locator("blockquote")).toHaveText("乙");
    const pasted = JSON.parse((await json.textContent())!);
    expect(pasted.children.map((block: { type: string }) => block.type)).toEqual([
      "paragraph",
      "heading",
      "orderedList",
      "table",
      "divider",
      "taskList",
      "quote",
      "paragraph",
      "paragraph",
    ]);
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
    await page.getByRole("button", { name: "撤销", exact: true }).click();
    await expect
      .poll(async () => JSON.parse((await json.textContent())!))
      .toEqual(regular);
    await page.getByRole("button", { name: "重做", exact: true }).click();
    await expect
      .poll(async () => JSON.parse((await json.textContent())!))
      .toEqual(pasted);
    await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
    const bounds = (await editor.locator("table").boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(backward ? 390 : 1280);
    await editor.screenshot({
      path: test
        .info()
        .outputPath(
          backward ? "mixed-clipboard-mobile.png" : "mixed-clipboard-desktop.png",
        ),
    });
  });
}

test("retains plain mixed copy and refuses mixed cut in HTML mode", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("mixed-clipboard");
  const json = page.getByLabel("文档 JSON", { exact: true });
  const before = await json.textContent();
  await selectText(page, "[1,0]", 1, "[6,0]", 1);
  const plain = await dispatchClipboard(page, "copy", "已渲染文档", true);
  expect(plain.types).toEqual(["text/plain"]);
  expect(plain.text).toContain("表格甲\t表格乙");
  await page.getByLabel("复制格式").selectOption("html");
  await selectText(page, "[1,0]", 1, "[6,0]", 1);
  const cut = await dispatchClipboard(page, "cut", "已渲染文档", true);
  expect(cut.prevented).toBe(true);
  expect(cut.types).toEqual([]);
  await expect(json).toHaveText(before!);
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
});

test("copies enclosed web images but falls back for mixed structural endpoints", async ({
  page,
}) => {
  await page.route("https://images.unsplash.com/**", (route) => route.abort());
  await page.goto("/");
  await page.getByLabel("复制格式").selectOption("html");
  await page.getByLabel("模型示例").selectOption("images");
  await selectText(page, "[0,0]", 0, "[2,0]", 4);
  const image = await dispatchClipboard(page, "copy", "已渲染文档", true);
  expect(image.types).toEqual(["text/plain", "text/html"]);
  expect(image.html).toContain("<img");
  expect(image.text).toBe("图片示例\n\n点击图片");
  await page.getByLabel("模型示例").selectOption("mixed-clipboard");
  await selectText(page, "[1,0]", 1, "[2,1,0]", 3);
  const endpoint = await dispatchClipboard(page, "copy", "已渲染文档", true);
  expect(endpoint.types).toEqual(["text/plain"]);
  expect(endpoint.text).toBe("甲\n编号甲\n编号乙");
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
});

for (const backward of [false, true]) {
  test(`round trips enclosed image references with one history entry (backward: ${backward})`, async ({
    page,
  }) => {
    await mockImageClipboard(page);
    if (backward) await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const json = page.getByLabel("文档 JSON", { exact: true });
    const regular = JSON.parse((await json.textContent())!);
    await page.getByLabel("模型示例").selectOption("image-clipboard");
    await page.getByLabel("复制格式").selectOption("html");
    const source = await json.textContent();
    const editor = page.getByLabel("已渲染文档");
    await expect
      .poll(() =>
        editor.locator("img").evaluate((img: HTMLImageElement) => img.naturalWidth),
      )
      .toBeGreaterThan(0);
    await selectText(
      page,
      backward ? "[3,0]" : "[1,0]",
      1,
      backward ? "[1,0]" : "[3,0]",
      1,
    );
    const copied = await dispatchClipboard(page, "copy", "已渲染文档", true);
    expect(copied.text).toBe("甲\n\n乙");
    expect(copied.html).toContain('alt="绿色植物"');
    expect(copied.html).toContain('width="320"');
    expect(copied.html).toContain('height="180"');
    expect(copied.html).not.toMatch(/未选|data-|aria-|contenteditable|status=/);
    await expect(json).toHaveText(source!);
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
    await pasteCopiedToRegular(page, copied);
    const image = editor.locator("img");
    await expect(image).toHaveCount(1);
    await expect(image).toHaveAttribute("alt", "绿色植物");
    await expect(image).toHaveAttribute("width", "320");
    await expect(image).toHaveAttribute("height", "180");
    await expect(editor.locator("strong")).toHaveText("甲");
    await expect(editor.locator("em")).toHaveText("乙");
    const pasted = JSON.parse((await json.textContent())!);
    expect(pasted.children[2]).toMatchObject({
      type: "image",
      alt: "绿色植物",
      width: 320,
      height: 180,
      status: "ready",
    });
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
    await page.getByRole("button", { name: "撤销", exact: true }).click();
    await expect
      .poll(async () => JSON.parse((await json.textContent())!))
      .toEqual(regular);
    await expect(image).toHaveCount(0);
    await page.getByRole("button", { name: "重做", exact: true }).click();
    await expect
      .poll(async () => JSON.parse((await json.textContent())!))
      .toEqual(pasted);
    await expect
      .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(0);
    await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
    const bounds = (await image.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(backward ? 390 : 1280);
    await editor.screenshot({
      path: test
        .info()
        .outputPath(
          backward ? "image-clipboard-mobile.png" : "image-clipboard-desktop.png",
        ),
    });
  });
}

test("keeps image copy plain by default and refuses image range cut", async ({
  page,
}) => {
  await mockImageClipboard(page);
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("image-clipboard");
  const json = page.getByLabel("文档 JSON", { exact: true });
  const before = await json.textContent();
  await selectText(page, "[1,0]", 1, "[3,0]", 1);
  const plain = await dispatchClipboard(page, "copy", "已渲染文档", true);
  expect(plain.types).toEqual(["text/plain"]);
  expect(plain.text).toBe("甲\n\n乙");
  await page.getByLabel("复制格式").selectOption("html");
  await selectText(page, "[1,0]", 1, "[3,0]", 1);
  const cut = await dispatchClipboard(page, "cut", "已渲染文档", true);
  expect(cut.prevented).toBe(true);
  expect(cut.types).toEqual([]);
  await expect(json).toHaveText(before!);
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
});

test("uses actual plain fallback when an image fragment is pasted into code", async ({
  page,
}) => {
  await mockImageClipboard(page);
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("image-clipboard");
  await page.getByLabel("复制格式").selectOption("html");
  await selectText(page, "[1,0]", 1, "[3,0]", 1);
  const copied = await dispatchClipboard(page, "copy", "已渲染文档", true);
  await page.getByLabel("模型示例").selectOption("code-block");
  const editor = page.getByLabel("已渲染文档");
  const length = (await editor.locator("pre code").textContent())!.length;
  await selectText(page, "[0,0]", 0, "[0,0]", length);
  await editor.evaluate((element, data) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData("text/plain", data.text);
    clipboardData.setData("text/html", data.html!);
    element.dispatchEvent(
      new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData }),
    );
  }, copied);
  await expect(editor.locator("pre code")).toHaveText("甲\n\n乙");
  await expect(editor.locator("img")).toHaveCount(0);
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
});

test("does not export an imported temporary image as partial HTML", async ({
  page,
}) => {
  await page.goto("/");
  await pasteCopiedToRegular(page, {
    text: "甲\n\n乙",
    html: '<p>甲</p><img src="blob:https://example.com/local"><p>乙</p>',
  });
  await page.getByLabel("复制格式").selectOption("html");
  const json = page.getByLabel("文档 JSON", { exact: true });
  const before = await json.textContent();
  await selectText(page, "[1,0]", 0, "[3,0]", 1);
  const copied = await dispatchClipboard(page, "copy", "已渲染文档", true);
  expect(copied.types).toEqual(["text/plain"]);
  expect(copied.text).toBe("甲\n\n乙");
  await expect(json).toHaveText(before!);
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
});

test("keeps the image model intact when HTML clipboard writing fails", async ({
  page,
}) => {
  await mockImageClipboard(page);
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("image-clipboard");
  await page.getByLabel("复制格式").selectOption("html");
  const json = page.getByLabel("文档 JSON", { exact: true });
  const before = await json.textContent();
  await selectText(page, "[1,0]", 1, "[3,0]", 1);
  const result = await page.getByLabel("已渲染文档").evaluate((editor) => {
    const clipboardData = new DataTransfer();
    Object.defineProperty(clipboardData, "setData", {
      value: (mime: string, value: string) => {
        if (mime === "text/html") throw new DOMException("HTML rejected");
        DataTransfer.prototype.setData.call(clipboardData, mime, value);
      },
    });
    const event = new ClipboardEvent("copy", {
      bubbles: true,
      cancelable: true,
      clipboardData,
    });
    editor.dispatchEvent(event);
    return {
      prevented: event.defaultPrevented,
      types: Array.from(clipboardData.types),
    };
  });
  expect(result).toEqual({ prevented: true, types: ["text/plain"] });
  await expect(json).toHaveText(before!);
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
});

for (const mobile of [false, true]) {
  test(`copies a clicked image block and pastes it with one history entry (mobile: ${mobile})`, async ({
    page,
  }) => {
    await mockImageClipboard(page);
    if (mobile) await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const json = page.getByLabel("文档 JSON", { exact: true });
    const regular = JSON.parse((await json.textContent())!);
    await page.getByLabel("模型示例").selectOption("image-clipboard");
    await page.getByLabel("复制格式").selectOption("html");
    const before = await json.textContent();
    const editor = page.getByLabel("已渲染文档");
    await selectText(page, "[1,0]", 1, "[3,0]", 1);
    await editor.locator("img").click();
    await expect(editor.locator("img")).toHaveAttribute("data-selected", "true");
    await expect(editor).toBeFocused();
    const copied = await dispatchClipboard(page, "copy", "已渲染文档", true);
    expect(copied.prevented).toBe(true);
    expect(copied.text).toBe("");
    expect(copied.types).toEqual(["text/plain", "text/html"]);
    expect(copied.html).toContain('alt="绿色植物"');
    expect(copied.html).not.toMatch(/<p|前甲|乙后|data-|aria-|contenteditable|status=/);
    await expect(json).toHaveText(before!);
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
    await pasteCopiedToRegular(page, copied);
    const image = editor.locator("img");
    await expect(image).toHaveCount(1);
    await expect(image).toHaveAttribute("alt", "绿色植物");
    await expect(image).toHaveAttribute("width", "320");
    await expect(image).toHaveAttribute("height", "180");
    const pasted = JSON.parse((await json.textContent())!);
    expect(pasted.children.map((block: { type: string }) => block.type)).toEqual([
      "paragraph",
      "image",
      "paragraph",
      "paragraph",
    ]);
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
    await page.getByRole("button", { name: "撤销", exact: true }).click();
    await expect
      .poll(async () => JSON.parse((await json.textContent())!))
      .toEqual(regular);
    await expect(image).toHaveCount(0);
    await page.getByRole("button", { name: "重做", exact: true }).click();
    await expect
      .poll(async () => JSON.parse((await json.textContent())!))
      .toEqual(pasted);
    await expect
      .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
      .toBeGreaterThan(0);
    await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
    const bounds = (await image.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(mobile ? 390 : 1280);
    await editor.screenshot({
      path: test
        .info()
        .outputPath(mobile ? "image-block-mobile.png" : "image-block-desktop.png"),
    });
  });
}

test("guards plain mode cut and focus for selected image blocks", async ({ page }) => {
  await mockImageClipboard(page);
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("image-clipboard");
  const editor = page.getByLabel("已渲染文档");
  const json = page.getByLabel("文档 JSON", { exact: true });
  const before = await json.textContent();
  await selectText(page, "[1,0]", 0, "[1,0]", 2);
  await editor.locator("img").click();
  const plain = await dispatchClipboard(page, "copy", "已渲染文档", true);
  expect(plain.prevented).toBe(true);
  expect(plain.types).toEqual([]);
  const cut = await dispatchClipboard(page, "cut", "已渲染文档", true);
  expect(cut.prevented).toBe(true);
  expect(cut.types).toEqual([]);
  await page.getByLabel("复制格式").selectOption("html");
  await page.getByLabel("复制格式").focus();
  await expect(editor).not.toBeFocused();
  expect((await dispatchClipboard(page, "copy", "已渲染文档", true)).types).toEqual([]);
  await editor.locator("img").click();
  expect((await dispatchClipboard(page, "copy", "已渲染文档", true)).html).toContain(
    "<img",
  );
  await expect(json).toHaveText(before!);
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
});

test("does not use a selected image when the DOM range is outside the editor", async ({
  page,
}) => {
  await mockImageClipboard(page);
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("image-clipboard");
  await page.getByLabel("复制格式").selectOption("html");
  const editor = page.getByLabel("已渲染文档");
  await editor.locator("img").click();
  await page
    .getByRole("heading", { level: 1, name: "crucialy-rich" })
    .evaluate((heading) => {
      const text = heading.firstChild!;
      window.getSelection()!.setBaseAndExtent(text, 0, text, 4);
    });
  await expect(editor).toBeFocused();
  const copied = await dispatchClipboard(page, "copy", "已渲染文档", true);
  expect(copied.prevented).toBe(false);
  expect(copied.types).toEqual([]);
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
});

test("does not replace code with inferred text from a selected image block", async ({
  page,
}) => {
  await mockImageClipboard(page);
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("image-clipboard");
  await page.getByLabel("复制格式").selectOption("html");
  const editor = page.getByLabel("已渲染文档");
  await editor.locator("img").click();
  const copied = await dispatchClipboard(page, "copy", "已渲染文档", true);
  expect(copied.text).toBe("");
  await page.getByLabel("模型示例").selectOption("code-block");
  const json = page.getByLabel("文档 JSON", { exact: true });
  const before = await json.textContent();
  const length = (await editor.locator("pre code").textContent())!.length;
  await selectText(page, "[0,0]", 0, "[0,0]", length);
  const prevented = await editor.evaluate((element, data) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData("text/plain", data.text);
    clipboardData.setData("text/html", data.html!);
    const event = new ClipboardEvent("paste", {
      bubbles: true,
      cancelable: true,
      clipboardData,
    });
    element.dispatchEvent(event);
    return event.defaultPrevented;
  }, copied);
  expect(prevented).toBe(true);
  await expect(json).toHaveText(before!);
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
});

test("does not delete model text when the browser rejects the HTML clipboard write", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("复制格式").selectOption("html");
  const json = page.getByLabel("文档 JSON", { exact: true });
  const before = await json.textContent();
  await selectText(page, "[0,0]", 0, "[0,0]", 3);
  const prevented = await page.getByLabel("已渲染文档").evaluate((editor) => {
    const clipboardData = new DataTransfer();
    Object.defineProperty(clipboardData, "setData", {
      value: (mime: string, value: string) => {
        if (mime === "text/html") throw new DOMException("Clipboard rejected HTML.");
        DataTransfer.prototype.setData.call(clipboardData, mime, value);
      },
    });
    const event = new ClipboardEvent("cut", {
      clipboardData,
      bubbles: true,
      cancelable: true,
    });
    editor.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(prevented).toBe(true);
  await expect(json).toHaveText(before!);
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
});
