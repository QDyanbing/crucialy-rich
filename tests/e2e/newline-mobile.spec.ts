import { expect, test } from "@playwright/test";
import { characterDocument, setCharacterCaret } from "./character-helpers";
import { nativeInput } from "./native-input-helpers";

for (const type of ["insertParagraph", "insertLineBreak"]) {
  for (const context of ["task", "cell", "code"]) {
    test(`preserves mobile ${context} newline rules for ${type}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/");
      await page
        .getByLabel("模型示例")
        .selectOption(
          context === "task"
            ? "list-clipboard"
            : context === "cell"
              ? "table-clipboard"
              : "code-block",
        );
      const editor = page.getByLabel("已渲染文档");
      const path =
        context === "task" ? [2, 1, 0] : context === "cell" ? [0, 0, 1, 1, 0] : [0, 0];
      if (context === "code") {
        await editor.evaluate((root) => {
          (root as HTMLElement).focus();
          const text = root.querySelector('[data-crucialy-path="[0,0]"]')!.firstChild!;
          window
            .getSelection()!
            .setBaseAndExtent(text, 0, text, text.textContent!.length);
        });
        await page.keyboard.insertText("A\n");
      }
      const before = await characterDocument(page);
      await setCharacterCaret(page, path, context === "code" ? 2 : 1);
      expect(await nativeInput(page, type)).toBe(true);
      const expected = structuredClone(before);
      if (context === "code") {
        if (type === "insertLineBreak") expected.children[0].children[0].text = "A\n\n";
        else
          expected.children.splice(1, 0, {
            type: "paragraph",
            children: [{ type: "text", text: "" }],
          });
      } else {
        const siblings =
          context === "task"
            ? expected.children[2].children
            : expected.children[0].children[0].children[1].children;
        const item = siblings[1];
        const text = item.children[0].text as string;
        if (type === "insertLineBreak")
          item.children[0].text = text.slice(0, 1) + "\n" + text.slice(1);
        else {
          const tail = structuredClone(item);
          item.children[0].text = text.slice(0, 1);
          tail.children[0].text = text.slice(1);
          if (context === "task") tail.checked = false;
          siblings.splice(2, 0, tail);
        }
      }
      await expect.poll(() => characterDocument(page)).toEqual(expected);
      await expect(page.getByLabel("History 状态")).toContainText(
        `"undoStack": ${context === "code" ? 2 : 1}`,
      );
      if (context === "task")
        await expect(
          editor.locator('[data-crucialy-path="[2,1]"] input'),
        ).toBeChecked();
      await page.getByRole("button", { name: "撤销", exact: true }).click();
      await expect.poll(() => characterDocument(page)).toEqual(before);
      await page.getByRole("button", { name: "重做", exact: true }).click();
      await expect.poll(() => characterDocument(page)).toEqual(expected);
      await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
      const bounds = (await editor.boundingBox())!;
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
      if (context === "task" && type === "insertLineBreak")
        await editor.screenshot({ path: test.info().outputPath("newline-mobile.png") });
    });
  }
}
