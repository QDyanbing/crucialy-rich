import { expect, test } from "@playwright/test";
import { characterDocument, setCharacterCaret } from "./character-helpers";
import { compose } from "./composition-helpers";

for (const mode of ["session", "native"]) {
  for (const key of ["Enter", "ArrowDown", "ArrowUp", "Escape"]) {
    test(`leaves Slash ${key} to the IME in ${mode} mode`, async ({ page }) => {
      await page.goto("/");
      await setCharacterCaret(page, [0, 0], 0);
      await page.keyboard.type("/h2");
      const menu = page.getByRole("listbox", { name: "插入块菜单" });
      await expect(menu).toBeVisible();
      const before = await characterDocument(page);
      const history = await page.getByLabel("History 状态").textContent();
      if (mode === "session") await compose(page, "compositionstart");
      const prevented = await page.getByLabel("已渲染文档").evaluate(
        (root, args) => {
          const event = new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            key: args.key,
            isComposing: args.mode === "native",
          });
          root.dispatchEvent(event);
          return event.defaultPrevented;
        },
        { key, mode },
      );
      expect(prevented).toBe(false);
      await expect.poll(() => characterDocument(page)).toEqual(before);
      await expect(page.getByLabel("History 状态")).toHaveText(history!);
      await expect(
        menu.locator('[aria-selected="true"] .crucialy-slash-menu__label'),
      ).toHaveText("2 级标题");
      if (mode === "session") await compose(page, "compositionend", "");
      await page.keyboard.press("Enter");
      await expect(menu).toHaveCount(0);
      await expect(page.getByLabel("已渲染文档").locator("h2")).toContainText("你好");
    });
  }
}
