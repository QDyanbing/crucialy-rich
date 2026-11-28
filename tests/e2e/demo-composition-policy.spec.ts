import { expect, test } from "@playwright/test";
import { characterDocument, setCharacterCaret } from "./character-helpers";
import { compose } from "./composition-helpers";
for (const width of [1280, 390]) {
  test(`locks Demo formatting and table actions during composition at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await page.getByLabel("模型示例").selectOption("tables");
    await setCharacterCaret(page, [1, 0], 1);
    await page.getByLabel("已渲染文档").dispatchEvent("mouseup");
    await compose(page, "compositionstart");
    const before = await characterDocument(page);
    const controls = page.getByLabel("操作控制");
    const bold = controls.getByRole("button", { name: "加粗", exact: true });
    await expect(bold).toBeDisabled();
    await bold.evaluate((node: HTMLButtonElement) => node.click());
    for (const name of [
      "首行前添加",
      "首行后添加",
      "删除首行",
      "首列前添加",
      "首列后添加",
      "删除首列",
      "删除表格",
    ]) {
      const button = page.getByRole("button", { name, exact: true });
      await expect(button).toBeDisabled();
      await button.evaluate((node: HTMLButtonElement) => node.click());
    }
    const font = page.getByLabel("字号", { exact: true });
    await expect(font).toBeDisabled();
    await font.evaluate((select: HTMLSelectElement) => {
      select.value = "24";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await expect.poll(() => characterDocument(page)).toEqual(before);
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
    await expect(
      page.getByLabel("Command 状态调试面板").locator('[data-state="enabled"]'),
    ).toHaveCount(0);
    await compose(page, "compositionend");
    await expect(bold).toBeEnabled();
    await bold.click();
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
  });
  test(`keeps History and normalize stable until composition ends at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const original = await characterDocument(page);
    await setCharacterCaret(page, [0, 0], 1);
    await page.keyboard.type("X");
    const changed = await characterDocument(page);
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "撤销", exact: true }).click();
    await setCharacterCaret(page, [0, 0], 2);
    await page.getByLabel("已渲染文档").dispatchEvent("mouseup");
    await compose(page, "compositionstart");
    const history = await page.getByLabel("History 状态").textContent();
    for (const name of ["撤销", "重做", "规范化"]) {
      const button = page.getByRole("button", { name, exact: true });
      await expect(button).toBeDisabled();
      await button.evaluate((node: HTMLButtonElement) => node.click());
    }
    await expect.poll(() => characterDocument(page)).toEqual(changed);
    await expect(page.getByLabel("History 状态")).toHaveText(history!);
    await compose(page, "compositionend");
    const undo = page.getByRole("button", { name: "撤销", exact: true });
    await expect(undo).toBeEnabled();
    await undo.click();
    await expect.poll(() => characterDocument(page)).toEqual(original);
    await page.getByRole("button", { name: "重做", exact: true }).click();
    await expect.poll(() => characterDocument(page)).toEqual(changed);
  });
}
