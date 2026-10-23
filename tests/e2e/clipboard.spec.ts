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
