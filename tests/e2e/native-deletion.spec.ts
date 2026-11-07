import { expect, test } from "@playwright/test";
import { characterDocument, setCharacterCaret } from "./character-helpers";
import { nativeInput } from "./native-input-helpers";

for (const type of ["deleteContentBackward", "deleteContentForward"]) {
  for (const mode of ["caret", "range"]) {
    test(`applies native ${type} without keydown and restores ${mode} History`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("/");
      const editor = page.getByLabel("已渲染文档");
      if (mode === "caret") {
        await editor.evaluate((root) => {
          (root as HTMLElement).focus();
          const text = root.querySelector('[data-crucialy-path="[0,0]"]')!.firstChild!;
          window
            .getSelection()!
            .setBaseAndExtent(text, 0, text, text.textContent!.length);
        });
        await page.keyboard.insertText("A\u{1f469}\u200d\u{1f4bb}B");
        await setCharacterCaret(page, [0, 0], type === "deleteContentBackward" ? 6 : 1);
      } else {
        await editor.evaluate((root) => {
          (root as HTMLElement).focus();
          const first = root.querySelector('[data-crucialy-path="[0,0]"]')!.firstChild!;
          const last = root.querySelector('[data-crucialy-path="[1,0]"]')!.firstChild!;
          window.getSelection()!.setBaseAndExtent(last, 1, first, 1);
        });
      }
      const before = await characterDocument(page);
      expect(await nativeInput(page, type)).toBe(true);
      const expected = structuredClone(before);
      if (mode === "caret") expected.children[0].children[0].text = "AB";
      else {
        expected.children[0].children[0].text =
          before.children[0].children[0].text.slice(0, 1) +
          before.children[1].children[0].text.slice(1);
        expected.children.splice(1, 1);
      }
      await expect.poll(() => characterDocument(page)).toEqual(expected);
      await expect(page.getByLabel("History 状态")).toContainText(
        `"undoStack": ${mode === "caret" ? 2 : 1}`,
      );
      await page.getByRole("button", { name: "撤销", exact: true }).click();
      await expect.poll(() => characterDocument(page)).toEqual(before);
      if (mode === "range")
        await expect(page.getByLabel("锚点路径")).toHaveValue("1,0");
      await page.getByRole("button", { name: "重做", exact: true }).click();
      await expect.poll(() => characterDocument(page)).toEqual(expected);
      await editor.focus();
      await page.keyboard.insertText("新");
      await page.getByRole("button", { name: "撤销", exact: true }).click();
      await expect.poll(() => characterDocument(page)).toEqual(expected);
      await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
      expect(errors).toEqual([]);
      if (mode === "caret" && type === "deleteContentForward")
        await editor.screenshot({
          path: test.info().outputPath("native-delete-desktop.png"),
        });
    });
  }

  test(`does not double-submit physical ${type} keyboard deletion`, async ({
    page,
  }) => {
    await page.goto("/");
    const original = await characterDocument(page);
    await setCharacterCaret(page, [0, 0], 1);
    await page.keyboard.press(
      type === "deleteContentBackward" ? "Backspace" : "Delete",
    );
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
    const after = await characterDocument(page);
    expect(after.children[0].children[0].text.length).toBe(
      original.children[0].children[0].text.length - 1,
    );
    await page.getByRole("button", { name: "撤销", exact: true }).click();
    await expect.poll(() => characterDocument(page)).toEqual(original);
  });
}
