import { expect, test } from "@playwright/test";
import { characterDocument, setCharacterCaret } from "./character-helpers";

test("discards a saved link range after editing the document", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "链接", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "链接设置" })).toBeVisible();
  await setCharacterCaret(page, [1, 0], 3);
  await page.keyboard.type("X");
  await expect(page.getByRole("dialog", { name: "链接设置" })).toHaveCount(0);
  const after = await characterDocument(page);
  expect(after.children[0].children[0].marks?.link).toBeUndefined();
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
});

for (const action of ["撤销", "重做", "规范化", "切换示例"] as const) {
  test(`discards a saved link range after ${action}`, async ({ page }) => {
    await page.goto("/");
    if (action === "撤销" || action === "重做") {
      await setCharacterCaret(page, [1, 0], 1);
      await page.keyboard.type("X");
      if (action === "重做")
        await page.getByRole("button", { name: "撤销", exact: true }).click();
    }
    await page.getByRole("button", { name: "链接", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "链接设置" })).toBeVisible();
    if (action === "切换示例") await page.getByLabel("模型示例").selectOption("links");
    else await page.getByRole("button", { name: action, exact: true }).click();
    await expect(page.getByRole("dialog", { name: "链接设置" })).toHaveCount(0);
  });
}
