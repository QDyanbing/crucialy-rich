import { expect, test, type Page } from "@playwright/test";
import { characterDocument, setCharacterCaret } from "./character-helpers";
async function prepare(page: Page) {
  await page.route("https://images.unsplash.com/**", (route) =>
    route.fulfill({
      contentType: "image/png",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        "base64",
      ),
    }),
  );
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("image-clipboard");
  return page.getByLabel("已渲染文档");
}
for (const width of [1280, 390]) {
  test(`locks Demo text controls for selected images at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const editor = await prepare(page);
    await editor.getByRole("img").click();
    const before = await characterDocument(page);
    const controls = page.getByLabel("操作控制");
    const bold = controls.getByRole("button", { name: "加粗", exact: true });
    for (const name of ["加粗", "引用", "代码块"]) {
      const button = controls.getByRole("button", { name, exact: true });
      await expect(button).toBeDisabled();
      await button.evaluate((node: HTMLButtonElement) => node.click());
    }
    for (const button of await page
      .getByRole("toolbar", { name: "固定格式工具栏" })
      .getByRole("button")
      .all())
      await expect(button).toBeDisabled();
    await expect(
      page.getByLabel("Command 状态调试面板").locator('[data-state="enabled"]'),
    ).toHaveCount(0);
    await expect(page.getByLabel("字号", { exact: true })).toBeDisabled();
    await page
      .getByLabel("字号", { exact: true })
      .evaluate((select: HTMLSelectElement) => {
        select.value = "24";
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });
    await expect.poll(() => characterDocument(page)).toEqual(before);
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
    await page
      .getByRole("toolbar", { name: "固定格式工具栏" })
      .screenshot({ path: test.info().outputPath("disabled-toolbar.png") });
    await editor.locator('[data-crucialy-path="[0,0]"]').click();
    await setCharacterCaret(page, [0, 0], 1);
    await editor.dispatchEvent("mouseup");
    await expect(bold).toBeEnabled();
    await bold.click();
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
  });
  test(`keeps image-selected History buttons usable at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const editor = await prepare(page);
    const original = await characterDocument(page);
    await setCharacterCaret(page, [0, 0], 1);
    await page.keyboard.type("X");
    const changed = await characterDocument(page);
    await editor.getByRole("img").click();
    const undo = page.getByRole("button", { name: "撤销", exact: true });
    await expect(undo).toBeEnabled();
    await undo.click();
    await expect.poll(() => characterDocument(page)).toEqual(original);
    await editor.getByRole("img").click();
    const redo = page.getByRole("button", { name: "重做", exact: true });
    await expect(redo).toBeEnabled();
    await redo.click();
    await expect.poll(() => characterDocument(page)).toEqual(changed);
  });
}
