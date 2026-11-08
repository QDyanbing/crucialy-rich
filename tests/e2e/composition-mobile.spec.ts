import { expect, test } from "@playwright/test";
import { characterDocument, setCharacterCaret } from "./character-helpers";
import { compose } from "./composition-helpers";

for (const context of ["task", "cell", "code"]) {
  for (const canceled of [false, true]) {
    test(`preserves mobile ${context} composition boundaries (canceled: ${canceled})`, async ({
      page,
    }) => {
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
      const before = await characterDocument(page);
      await setCharacterCaret(page, path, 1);
      if (context === "cell")
        await editor.evaluate((root) => {
          const first = root.querySelector(
            '[data-crucialy-path="[0,0,1,1,0]"]',
          )!.firstChild!;
          const last = root.querySelector(
            '[data-crucialy-path="[0,0,1,2,0]"]',
          )!.firstChild!;
          window.getSelection()!.setBaseAndExtent(last, 1, first, 1);
        });
      if (canceled)
        await editor.evaluate((root) =>
          root.addEventListener("compositionend", (event) => event.preventDefault(), {
            once: true,
          }),
        );
      await compose(page, "compositionstart");
      await compose(page, "compositionupdate", "候选");
      await expect.poll(() => characterDocument(page)).toEqual(before);
      await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
      await compose(page, "compositionend", "中文");
      await expect(editor).toHaveAttribute("data-composing", "false");
      const expected = structuredClone(before);
      if (!canceled) {
        if (context === "cell") {
          const paragraphs = expected.children[0].children[0].children[1].children;
          const prefix = structuredClone(paragraphs[1].children[0]);
          const suffix = structuredClone(paragraphs[2].children[0]);
          prefix.text = prefix.text.slice(0, 1) + "中文";
          suffix.text = suffix.text.slice(1);
          paragraphs.splice(1, 2, { type: "paragraph", children: [prefix, suffix] });
        } else {
          let text = expected;
          for (const index of path) text = text.children[index];
          text.text = text.text.slice(0, 1) + "中文" + text.text.slice(1);
        }
      }
      await expect.poll(() => characterDocument(page)).toEqual(expected);
      await expect(page.getByLabel("History 状态")).toContainText(
        `"undoStack": ${canceled ? 0 : 1}`,
      );
      if (canceled) {
        await setCharacterCaret(page, path, 1);
        await compose(page, "compositionstart");
        await compose(page, "compositionend", "新");
        await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
      } else {
        await page.getByRole("button", { name: "撤销", exact: true }).click();
        await expect.poll(() => characterDocument(page)).toEqual(before);
        await page.getByRole("button", { name: "重做", exact: true }).click();
        await expect.poll(() => characterDocument(page)).toEqual(expected);
        if (context === "task")
          await expect(
            editor.locator('[data-crucialy-path="[2,1]"] input'),
          ).toBeChecked();
      }
      await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
      const bounds = (await editor.boundingBox())!;
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
      if (context === "task" && !canceled)
        await editor.screenshot({
          path: test.info().outputPath("composition-mobile.png"),
        });
    });
  }
}
