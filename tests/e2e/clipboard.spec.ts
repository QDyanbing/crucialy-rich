import { expect, test, type Page } from "@playwright/test";

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
) {
  return page.getByLabel(label).evaluate((editor, eventType) => {
    const clipboardData = new DataTransfer();
    const event = new ClipboardEvent(eventType, {
      bubbles: true,
      cancelable: true,
      clipboardData,
    });
    editor.dispatchEvent(event);
    return {
      prevented: event.defaultPrevented,
      text: clipboardData.getData("text/plain"),
      types: Array.from(clipboardData.types),
    };
  }, type);
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
