import { expect, test, type Page } from "@playwright/test";

async function prepareImage(page: Page) {
  await page.route("https://images.unsplash.com/**", (route) =>
    route.fulfill({
      contentType: "image/png",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        "base64",
      ),
    }),
  );
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("image-clipboard");
  await page.getByLabel("复制格式").selectOption("html");
  return page.getByLabel("已渲染文档");
}

async function imageClipboard(page: Page, type: "copy" | "cut") {
  return page.getByLabel("已渲染文档").evaluate((editor, type) => {
    const clipboardData = new DataTransfer();
    const event = new ClipboardEvent(type, {
      clipboardData,
      bubbles: true,
      cancelable: true,
    });
    editor.dispatchEvent(event);
    return {
      prevented: event.defaultPrevented,
      html: clipboardData.getData("text/html"),
      text: clipboardData.getData("text/plain"),
    };
  }, type);
}

async function placeTextCaret(page: Page) {
  await page.getByLabel("已渲染文档").evaluate((editor) => {
    (editor as HTMLElement).focus();
    const text = editor.querySelector('[data-crucialy-path="[1,0]"]')!.firstChild!;
    window.getSelection()!.setBaseAndExtent(text, 1, text, 1);
    editor.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  });
}

test("clears a later image highlight when undo restores a text-only snapshot", async ({
  page,
}) => {
  const editor = await prepareImage(page);
  const json = page.getByLabel("文档 JSON", { exact: true });
  const original = JSON.parse((await json.textContent())!);
  await editor.locator('[data-crucialy-path="[1,0]"]').click();
  await placeTextCaret(page);
  await editor.press("x");
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
  const image = editor.locator("img");
  await image.click();
  await expect(image).toHaveAttribute("data-selected", "true");
  await page.getByRole("button", { name: "撤销", exact: true }).click();
  await expect
    .poll(async () => JSON.parse((await json.textContent())!))
    .toEqual(original);
  await expect(image).not.toHaveAttribute("data-selected", "true");
  await page.getByRole("button", { name: "重做", exact: true }).click();
  await expect(image).not.toHaveAttribute("data-selected", "true");
});

test("restores selected image through native history shortcuts", async ({ page }) => {
  const editor = await prepareImage(page);
  const image = editor.locator("img");
  await image.click();
  await editor.press("Delete");
  await expect(image).toHaveCount(0);
  await editor.press("ControlOrMeta+z");
  await expect(image).toHaveAttribute("data-selected", "true");
  await editor.press("ControlOrMeta+Shift+z");
  await expect(image).toHaveCount(0);
  await editor.press("ControlOrMeta+z");
  await expect(image).toHaveAttribute("data-selected", "true");
  await editor.locator('[data-crucialy-path="[1,0]"]').click();
  await expect(image).not.toHaveAttribute("data-selected", "true");
  await placeTextCaret(page);
  await editor.press("x");
  await expect(image).toHaveCount(1);
  await page.getByRole("button", { name: "撤销", exact: true }).click();
  await expect(image).not.toHaveAttribute("data-selected", "true");
  await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
});

for (const mobile of [false, true]) {
  for (const action of ["cut", "Backspace", "Delete"] as const) {
    test(`restores selected image after ${action} and allows another edit (mobile: ${mobile})`, async ({
      page,
    }) => {
      if (mobile) await page.setViewportSize({ width: 390, height: 844 });
      const editor = await prepareImage(page);
      const json = page.getByLabel("文档 JSON", { exact: true });
      const original = JSON.parse((await json.textContent())!);
      const image = editor.locator("img");
      const undo = page.getByRole("button", { name: "撤销", exact: true });
      const redo = page.getByRole("button", { name: "重做", exact: true });
      await image.click();
      await expect(page.getByRole("toolbar", { name: "悬浮格式工具栏" })).toHaveCount(
        0,
      );
      if (action === "cut")
        expect((await imageClipboard(page, "cut")).html).toContain("<img");
      else await editor.press(action);
      await expect(image).toHaveCount(0);
      await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
      await undo.click();
      await expect
        .poll(async () => JSON.parse((await json.textContent())!))
        .toEqual(original);
      await expect(image).toHaveAttribute("data-selected", "true");
      await expect(page.getByRole("toolbar", { name: "悬浮格式工具栏" })).toHaveCount(
        0,
      );
      await editor.focus();
      await editor.evaluate(() => window.getSelection()!.removeAllRanges());
      const copied = await imageClipboard(page, "copy");
      expect(copied.prevented).toBe(true);
      expect(copied.text).toBe("");
      expect(copied.html).toContain('alt="绿色植物"');
      expect(copied.html).not.toMatch(/<p|data-|aria-|未选/);
      await expect(page.getByLabel("History 状态")).toContainText('"redoStack": 1');
      await expect
        .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
        .toBeGreaterThan(0);
      const bounds = (await image.boundingBox())!;
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(mobile ? 390 : 1280);
      await editor.screenshot({
        path: test
          .info()
          .outputPath(
            mobile ? "selected-image-mobile.png" : "selected-image-desktop.png",
          ),
      });
      if (action === "cut") await imageClipboard(page, "cut");
      else await editor.press(action);
      await expect(image).toHaveCount(0);
      await expect(page.getByLabel("History 状态")).toContainText('"redoStack": 0');
      await undo.click();
      await expect(image).toHaveAttribute("data-selected", "true");
      await redo.click();
      await expect(image).toHaveCount(0);
      await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
    });
  }
}
