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
