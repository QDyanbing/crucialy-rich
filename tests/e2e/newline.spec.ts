import { expect, test } from "@playwright/test";
import { characterDocument, setCharacterCaret } from "./character-helpers";
import { nativeInput } from "./native-input-helpers";

for (const type of ["insertParagraph", "insertLineBreak"]) {
  for (const route of ["native", "keyboard"]) {
    test(`keeps ${type} distinct through ${route} and History`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("/");
      const editor = page.getByLabel("已渲染文档");
      const before = await characterDocument(page);
      await setCharacterCaret(page, [0, 0], 1);
      if (route === "native") expect(await nativeInput(page, type)).toBe(true);
      else
        await page.keyboard.press(type === "insertParagraph" ? "Enter" : "Shift+Enter");
      const expected = structuredClone(before);
      const text = before.children[0].children[0].text as string;
      if (type === "insertParagraph") {
        const tail = structuredClone(expected.children[0]);
        expected.children[0].children[0].text = text.slice(0, 1);
        tail.children[0].text = text.slice(1);
        expected.children.splice(1, 0, tail);
      } else
        expected.children[0].children[0].text = text.slice(0, 1) + "\n" + text.slice(1);
      await expect.poll(() => characterDocument(page)).toEqual(expected);
      await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
      if (type === "insertLineBreak") {
        const rows = await editor
          .locator('[data-crucialy-path="[0,0]"]')
          .evaluate((leaf) => {
            const text = leaf.firstChild!;
            const range = document.createRange();
            range.setStart(text, 0);
            range.setEnd(text, 1);
            const first = range.getBoundingClientRect().y;
            range.setStart(text, 2);
            range.setEnd(text, 3);
            return { first, next: range.getBoundingClientRect().y };
          });
        expect(rows.next).toBeGreaterThan(rows.first);
      }
      await page.getByRole("button", { name: "撤销", exact: true }).click();
      await expect.poll(() => characterDocument(page)).toEqual(before);
      await page.getByRole("button", { name: "重做", exact: true }).click();
      await expect.poll(() => characterDocument(page)).toEqual(expected);
      await editor.focus();
      await page.keyboard.insertText("新");
      const continued = await characterDocument(page);
      expect(
        continued.children[type === "insertParagraph" ? 1 : 0].children[0].text,
      ).toContain(type === "insertParagraph" ? "新" : "\n新");
      await page.getByRole("button", { name: "撤销", exact: true }).click();
      await expect.poll(() => characterDocument(page)).toEqual(expected);
      await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
      expect(errors).toEqual([]);
      if (route === "native" && type === "insertLineBreak")
        await editor.screenshot({
          path: test.info().outputPath("newline-desktop.png"),
        });
    });
  }

  test(`replaces a backward range atomically with ${type}`, async ({ page }) => {
    await page.goto("/");
    const editor = page.getByLabel("已渲染文档");
    const before = await characterDocument(page);
    await editor.evaluate((root) => {
      (root as HTMLElement).focus();
      const first = root.querySelector('[data-crucialy-path="[0,0]"]')!.firstChild!;
      const last = root.querySelector('[data-crucialy-path="[1,0]"]')!.firstChild!;
      window.getSelection()!.setBaseAndExtent(last, 1, first, 1);
    });
    expect(await nativeInput(page, type)).toBe(true);
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
    const after = await characterDocument(page);
    expect(after.children).toHaveLength(type === "insertParagraph" ? 2 : 1);
    const first = before.children[0].children[0].text.slice(0, 1);
    const last = before.children[1].children[0].text.slice(1);
    expect(after.children[0].children[0].text).toBe(
      type === "insertParagraph" ? first : first + "\n" + last,
    );
    await page.getByRole("button", { name: "撤销", exact: true }).click();
    await expect.poll(() => characterDocument(page)).toEqual(before);
    await expect(page.getByLabel("锚点路径")).toHaveValue("1,0");
  });
}
