import { expect, test } from "@playwright/test";
import { characterDocument, setCharacterCaret } from "./character-helpers";

for (const key of ["Backspace", "Delete"]) {
  for (const cluster of [
    "\u{1f600}",
    "e\u0301",
    "\u{1f469}\u200d\u{1f4bb}",
    "\u{1f1e8}\u{1f1f3}",
  ]) {
    test(`deletes one complete grapheme with native ${key}: ${cluster}`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("/");
      const editor = page.getByLabel("已渲染文档");
      await editor.evaluate((root) => {
        (root as HTMLElement).focus();
        const node = root.querySelector('[data-crucialy-path="[0,0]"]')!.firstChild!;
        window
          .getSelection()!
          .setBaseAndExtent(node, 0, node, node.textContent!.length);
      });
      await page.keyboard.insertText(`A${cluster}B`);
      await expect(editor.locator("p").first()).toHaveText(`A${cluster}B`);
      const before = await characterDocument(page);
      await setCharacterCaret(
        page,
        [0, 0],
        key === "Backspace" ? 1 + cluster.length : 1,
      );
      await page.keyboard.press(key);
      await expect(editor.locator("p").first()).toHaveText("AB");
      const after = await characterDocument(page);
      expect(after.children[1]).toEqual(before.children[1]);
      await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 2');
      await page.getByRole("button", { name: "撤销", exact: true }).click();
      await expect.poll(() => characterDocument(page)).toEqual(before);
      await expect(page.getByLabel("锚点偏移")).toHaveValue(
        String(key === "Backspace" ? 1 + cluster.length : 1),
      );
      await page.getByRole("button", { name: "重做", exact: true }).click();
      await expect.poll(() => characterDocument(page)).toEqual(after);
      await editor.focus();
      await page.keyboard.insertText("新");
      await expect(editor.locator("p").first()).toHaveText("A新B");
      await page.getByRole("button", { name: "撤销", exact: true }).click();
      await expect.poll(() => characterDocument(page)).toEqual(after);
      await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
      expect(errors).toEqual([]);
      if (key === "Delete" && cluster.includes("\u200d"))
        await editor.screenshot({
          path: test.info().outputPath("grapheme-desktop.png"),
        });
    });
  }
}
