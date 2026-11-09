import { expect, test } from "@playwright/test";
import { characterDocument, setCharacterCaret } from "./character-helpers";

for (const modifier of ["altKey", "ctrlKey", "metaKey", "shiftKey"]) {
  for (const key of ["ArrowDown", "Escape"]) {
    test(`does not claim Slash ${modifier}+${key}`, async ({ page }) => {
      await page.goto("/");
      await setCharacterCaret(page, [0, 0], 0);
      await page.keyboard.type("/");
      const before = await characterDocument(page);
      const menu = page.getByRole("listbox", { name: "插入块菜单" });
      const active = menu.locator('[aria-selected="true"]');
      const label = await active.textContent();
      const prevented = await page.getByLabel("已渲染文档").evaluate(
        (root, args) => {
          const event = new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            key: args.key,
            [args.modifier]: true,
          });
          root.dispatchEvent(event);
          return event.defaultPrevented;
        },
        { modifier, key },
      );
      expect(prevented).toBe(false);
      await expect(menu).toBeVisible();
      await expect(active).toHaveText(label!);
      await expect.poll(() => characterDocument(page)).toEqual(before);
      await page.keyboard.press("Escape");
      await expect(menu).toHaveCount(0);
    });
  }
}

test("keeps Shift+Enter as a soft line break while Slash is open", async ({ page }) => {
  await page.goto("/");
  await setCharacterCaret(page, [0, 0], 0);
  await page.keyboard.type("/h2");
  await page.keyboard.press("Shift+Enter");
  const after = await characterDocument(page);
  expect(after.children[0]).toMatchObject({
    type: "paragraph",
    children: [{ text: "/h2\n你好，crucialy-rich。" }],
  });
  await expect(page.getByRole("listbox", { name: "插入块菜单" })).toHaveCount(0);
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 2');
  await page.getByRole("button", { name: "撤销", exact: true }).click();
  expect((await characterDocument(page)).children[0].children[0].text).toBe(
    "/h2你好，crucialy-rich。",
  );
});
