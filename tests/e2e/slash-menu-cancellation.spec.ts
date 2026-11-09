import { expect, test } from "@playwright/test";
import { characterDocument, setCharacterCaret } from "./character-helpers";

for (const key of ["Enter", "ArrowUp", "ArrowDown", "Escape"]) {
  test(`honors a native host cancellation before Slash ${key}`, async ({ page }) => {
    await page.goto("/");
    await setCharacterCaret(page, [0, 0], 0);
    await page.keyboard.type("/");
    const menu = page.getByRole("listbox", { name: "插入块菜单" });
    const before = await characterDocument(page);
    const active = await menu.locator('[aria-selected="true"]').textContent();
    const history = await page.getByLabel("History 状态").textContent();
    await page.getByLabel("已渲染文档").evaluate((root, key) => {
      root.addEventListener("keydown", (event) => event.preventDefault(), {
        once: true,
      });
      root.dispatchEvent(
        new KeyboardEvent("keydown", {
          key,
          bubbles: true,
          cancelable: true,
        }),
      );
    }, key);
    await expect(menu).toBeVisible();
    await expect(menu.locator('[aria-selected="true"]')).toHaveText(active!);
    await expect.poll(() => characterDocument(page)).toEqual(before);
    await expect(page.getByLabel("History 状态")).toHaveText(history!);
    await page.keyboard.press("Enter");
    await expect(menu).toHaveCount(0);
    expect((await characterDocument(page)).children[0].children[0].text).toBe(
      "你好，crucialy-rich。",
    );
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 2');
  });
}
