import { expect, test } from "@playwright/test";
import { characterDocument, setCharacterCaret } from "./character-helpers";
import { compose } from "./composition-helpers";
for (const width of [1280, 390]) {
  for (const mode of ["canceled", "composing"]) {
    test(`protects an input rule suffix when ${mode} at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/");
      await setCharacterCaret(page, [0, 0], 0);
      await page.keyboard.type("-");
      const before = await characterDocument(page);
      const history = await page.getByLabel("History 状态").textContent();
      const editor = page.getByLabel("已渲染文档");
      if (mode === "canceled") {
        await editor.evaluate((root) =>
          root.addEventListener("keydown", (event) => event.preventDefault(), {
            once: true,
          }),
        );
        await page.keyboard.press("Space");
      } else {
        await compose(page, "compositionstart");
        await editor.dispatchEvent("textInput", {
          data: " ",
          bubbles: true,
          cancelable: true,
        });
      }
      await expect.poll(() => characterDocument(page)).toEqual(before);
      await expect(page.getByLabel("History 状态")).toHaveText(history!);
      if (mode === "composing") await compose(page, "compositionend");
      await page.keyboard.press("Space");
      expect((await characterDocument(page)).children[0].type).toBe("bulletList");
    });
  }
}
