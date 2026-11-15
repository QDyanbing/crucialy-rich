import { expect, test, type Page } from "@playwright/test";
import { characterDocument, setCharacterCaret } from "./character-helpers";

const errors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const messages: string[] = [];
  errors.set(page, messages);
  page.on("pageerror", (error) => messages.push(error.message));
});
test.afterEach(({ page }) => {
  expect(errors.get(page)).toEqual([]);
});
async function selectText(page: Page, reverse = false) {
  await page.getByLabel("已渲染文档").scrollIntoViewIfNeeded();
  await setCharacterCaret(page, [0, 0], 1);
  await page.getByLabel("已渲染文档").evaluate((root, reverse) => {
    const text = root.querySelector('[data-crucialy-path="[0,0]"]')!.firstChild!;
    window
      .getSelection()!
      .setBaseAndExtent(text, reverse ? 3 : 1, text, reverse ? 1 : 3);
    root.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  }, reverse);
}

for (const width of [1280, 390]) {
  for (const label of ["固定格式工具栏", "悬浮格式工具栏"]) {
    test(`enters and exits ${label} with one Tab stop at width ${width}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/");
      await selectText(page);
      const before = await characterDocument(page);
      const toolbar = page.getByRole("toolbar", { name: label });
      const bold = toolbar.getByRole("button", { name: /加粗$/u });
      const italic = toolbar.getByRole("button", { name: /斜体$/u });
      const quote = toolbar.getByRole("button", { name: /引用$/u });
      await (
        label === "固定格式工具栏"
          ? page.getByLabel("复制格式")
          : page.getByLabel("已渲染文档")
      ).focus();
      await page.keyboard.press("Tab");
      await expect(bold).toBeFocused();
      await page.keyboard.press("ArrowRight");
      await expect(italic).toBeFocused();
      await page.keyboard.press("End");
      await expect(quote).toBeFocused();
      await page.keyboard.press("Home");
      await expect(bold).toBeFocused();
      await page.keyboard.press("ArrowLeft");
      await expect(quote).toBeFocused();
      await expect(toolbar.locator('button[tabindex="0"]')).toHaveCount(1);
      await toolbar.screenshot({
        path: test.info().outputPath("toolbar-keyboard-focus.png"),
      });
      await page.keyboard.press("Tab");
      expect(
        await toolbar.evaluate((root) => root.contains(document.activeElement)),
      ).toBe(false);
      await page.keyboard.press("Shift+Tab");
      await expect(quote).toBeFocused();
      await expect.poll(() => characterDocument(page)).toEqual(before);
      await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
    });

    for (const key of ["Enter", "Space"]) {
      test(`activates ${label} with ${key} once at width ${width}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 844 });
        await page.goto("/");
        await selectText(page, width === 390);
        const before = await characterDocument(page);
        const toolbar = page.getByRole("toolbar", { name: label });
        await toolbar.getByRole("button", { name: /加粗$/u }).focus();
        await page.keyboard.press("ArrowRight");
        await expect(toolbar.getByRole("button", { name: /斜体$/u })).toBeFocused();
        await page.keyboard.press(key);
        const after = await characterDocument(page);
        expect(after.children[0].children).toContainEqual({
          type: "text",
          text: "好，",
          marks: { italic: true },
        });
        await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
        await page.getByRole("button", { name: "撤销", exact: true }).click();
        await expect.poll(() => characterDocument(page)).toEqual(before);
        await page.getByRole("button", { name: "重做", exact: true }).click();
        await expect.poll(() => characterDocument(page)).toEqual(after);
        await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
      });
    }
  }

  test(`uses inherited RTL and honors a canceled key at width ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await selectText(page);
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const toolbar = page.getByRole("toolbar", { name: "固定格式工具栏" });
    const bold = toolbar.getByRole("button", { name: /加粗$/u });
    const italic = toolbar.getByRole("button", { name: /斜体$/u });
    await bold.focus();
    await bold.evaluate((element) =>
      element.addEventListener("keydown", (event) => event.preventDefault(), {
        once: true,
      }),
    );
    await page.keyboard.press("ArrowLeft");
    await expect(bold).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(italic).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(bold).toBeFocused();
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
  });
}
