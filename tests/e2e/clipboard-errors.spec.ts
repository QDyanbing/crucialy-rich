import { expect, test } from "@playwright/test";

for (const mobile of [false, true]) {
  for (const failure of ["missing", "types", "html-read", "plain-read"]) {
    test(`keeps a failed clipboard read atomic and accepts a later paste (${failure}, mobile: ${mobile})`, async ({
      page,
    }) => {
      if (mobile) await page.setViewportSize({ width: 390, height: 844 });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("/");
      const editor = page.getByLabel("已渲染文档");
      const json = page.getByLabel("文档 JSON", { exact: true });
      const original = JSON.parse((await json.textContent())!);
      const result = await editor.evaluate((root, failure) => {
        (root as HTMLElement).focus();
        const text = root.querySelector('[data-crucialy-path="[0,0]"]')!.firstChild!;
        window.getSelection()!.setBaseAndExtent(text, 1, text, 3);
        const data = failure === "missing" ? null : new DataTransfer();
        const reads: string[] = [];
        if (data) {
          data.setData("text/plain", "不应使用的回退文字");
          if (failure === "html-read")
            data.setData("text/html", '<p class="MsoNormal">Office</p>');
          if (failure === "types")
            Object.defineProperty(data, "types", {
              get() {
                throw new DOMException("MIME unavailable");
              },
            });
          else
            Object.defineProperty(data, "getData", {
              value: (mime: string) => {
                reads.push(mime);
                throw new DOMException("Clipboard unavailable");
              },
            });
        }
        const event = new ClipboardEvent("paste", {
          clipboardData: data,
          bubbles: true,
          cancelable: true,
        });
        root.dispatchEvent(event);
        return {
          prevented: event.defaultPrevented,
          reads,
          anchor: window.getSelection()!.anchorOffset,
          focus: window.getSelection()!.focusOffset,
        };
      }, failure);
      expect(result).toEqual({
        prevented: true,
        reads:
          failure === "html-read"
            ? ["text/html"]
            : failure === "plain-read"
              ? ["text/plain"]
              : [],
        anchor: 1,
        focus: 3,
      });
      await expect
        .poll(async () => JSON.parse((await json.textContent())!))
        .toEqual(original);
      await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
      expect(errors).toEqual([]);
      const copied = await editor.evaluate((root) => {
        const clipboardData = new DataTransfer();
        root.dispatchEvent(
          new ClipboardEvent("copy", {
            clipboardData,
            bubbles: true,
            cancelable: true,
          }),
        );
        return clipboardData.getData("text/plain");
      });
      expect(copied).toBe(original.children[0].children[0].text.slice(1, 3));
      await editor.evaluate((root) => {
        const clipboardData = new DataTransfer();
        clipboardData.setData("text/plain", "新");
        root.dispatchEvent(
          new ClipboardEvent("paste", {
            clipboardData,
            bubbles: true,
            cancelable: true,
          }),
        );
      });
      await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
      const text = original.children[0].children[0].text as string;
      const edited = JSON.parse((await json.textContent())!);
      expect(edited.children[0].children[0].text).toBe(
        text.slice(0, 1) + "新" + text.slice(3),
      );
      await page.getByRole("button", { name: "撤销", exact: true }).click();
      await expect
        .poll(async () => JSON.parse((await json.textContent())!))
        .toEqual(original);
      await page.getByRole("button", { name: "重做", exact: true }).click();
      await expect
        .poll(async () => JSON.parse((await json.textContent())!))
        .toEqual(edited);
      await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
      expect(errors).toEqual([]);
      const bounds = (await editor.boundingBox())!;
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(mobile ? 390 : 1280);
      await editor.screenshot({
        path: test
          .info()
          .outputPath(
            mobile ? "clipboard-recovery-mobile.png" : "clipboard-recovery-desktop.png",
          ),
      });
    });
  }
}
