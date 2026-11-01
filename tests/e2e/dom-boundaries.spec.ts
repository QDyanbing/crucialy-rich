import { expect, test, type Page } from "@playwright/test";

async function clipboard(page: Page, type: "copy" | "cut") {
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
      text: clipboardData.getData("text/plain"),
      html: clipboardData.getData("text/html"),
    };
  }, type);
}

for (const mobile of [false, true]) {
  for (const backward of [false, true]) {
    test(`round trips element-boundary clipboard and history (mobile: ${mobile}, backward: ${backward})`, async ({
      page,
    }) => {
      if (mobile) await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/");
      await page.getByLabel("复制格式").selectOption("html");
      const editor = page.getByLabel("已渲染文档");
      const json = page.getByLabel("文档 JSON", { exact: true });
      const original = JSON.parse((await json.textContent())!);
      const text = original.children[0].children[0].text as string;
      await editor.evaluate((root, backward) => {
        (root as HTMLElement).focus();
        const leaf = root.querySelector('[data-crucialy-path="[0,0]"]')!;
        window
          .getSelection()!
          .setBaseAndExtent(leaf, backward ? 1 : 0, leaf, backward ? 0 : 1);
      }, backward);
      const copied = await clipboard(page, "copy");
      expect(copied).toEqual({
        prevented: true,
        text,
        html: `<p><span>${text}</span></p>`,
      });
      await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
      const cut = await clipboard(page, "cut");
      expect(cut).toEqual(copied);
      const removed = JSON.parse((await json.textContent())!);
      expect(removed.children[0].children[0].text).toBe("");
      expect(removed.children[1]).toEqual(original.children[1]);
      await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
      const undo = page.getByRole("button", { name: "撤销", exact: true });
      const redo = page.getByRole("button", { name: "重做", exact: true });
      await undo.click();
      await expect
        .poll(async () => JSON.parse((await json.textContent())!))
        .toEqual(original);
      await expect(page.getByLabel("锚点偏移")).toHaveValue(
        String(backward ? text.length : 0),
      );
      await expect(page.getByLabel("焦点偏移")).toHaveValue(
        String(backward ? 0 : text.length),
      );
      await redo.click();
      await editor.focus();
      await editor.evaluate((root, data) => {
        const clipboardData = new DataTransfer();
        clipboardData.setData("text/plain", data.text);
        clipboardData.setData("text/html", data.html);
        root.dispatchEvent(
          new ClipboardEvent("paste", {
            clipboardData,
            bubbles: true,
            cancelable: true,
          }),
        );
      }, cut);
      await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 2');
      await expect(editor).toContainText(text);
      await undo.click();
      await expect
        .poll(async () => JSON.parse((await json.textContent())!))
        .toEqual(removed);
      await undo.click();
      await expect
        .poll(async () => JSON.parse((await json.textContent())!))
        .toEqual(original);
      await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
      const bounds = (await editor.boundingBox())!;
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(mobile ? 390 : 1280);
      await editor.screenshot({
        path: test
          .info()
          .outputPath(mobile ? "dom-boundary-mobile.png" : "dom-boundary-desktop.png"),
      });
    });
  }
}
