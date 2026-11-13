import { expect, test, type Page } from "@playwright/test";
import { characterDocument, setCharacterCaret } from "./character-helpers";
import { compose } from "./composition-helpers";

async function selectRange(page: Page, start = 1, end = 3) {
  await page.getByLabel("已渲染文档").scrollIntoViewIfNeeded();
  await setCharacterCaret(page, [0, 0], start);
  await page.getByLabel("已渲染文档").evaluate(
    (root, { start, end }) => {
      const text = root.querySelector('[data-crucialy-path="[0,0]"]')!.firstChild!;
      window.getSelection()!.setBaseAndExtent(text, start, text, end);
      root.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    },
    { start, end },
  );
}

for (const width of [1280, 390]) {
  for (const label of ["固定格式工具栏", "悬浮格式工具栏"]) {
    test(`locks ${label} during composition at width ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("/");
      await selectRange(page);
      const before = await characterDocument(page);
      const toolbar = page.getByRole("toolbar", { name: label });
      const bold = toolbar.getByRole("button", { name: /加粗$/u });
      await expect(bold).toBeEnabled();
      await compose(page, "compositionstart");
      await expect(bold).toBeDisabled();
      await bold.evaluate((button: HTMLButtonElement) => button.click());
      await expect.poll(() => characterDocument(page)).toEqual(before);
      await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
      await compose(page, "compositionend", "中");
      const composed = await characterDocument(page);
      await selectRange(page, 1, 2);
      await expect(bold).toBeEnabled();
      await bold.click();
      const formatted = await characterDocument(page);
      expect(formatted.children[0].children).toContainEqual({
        type: "text",
        text: "中",
        marks: { bold: true },
      });
      await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 2');
      await page.getByRole("button", { name: "撤销", exact: true }).click();
      await expect.poll(() => characterDocument(page)).toEqual(composed);
      await page.getByRole("button", { name: "撤销", exact: true }).click();
      await expect.poll(() => characterDocument(page)).toEqual(before);
      await page.getByRole("button", { name: "重做", exact: true }).click();
      await page.getByRole("button", { name: "重做", exact: true }).click();
      await expect.poll(() => characterDocument(page)).toEqual(formatted);
      await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
      await page
        .getByLabel("已渲染文档")
        .screenshot({ path: test.info().outputPath("toolbar-result.png") });
      expect(errors).toEqual([]);
    });
  }

  test(`does not apply an old Toolbar press after model replacement at width ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await selectRange(page);
    const bold = page
      .getByRole("toolbar", { name: "固定格式工具栏" })
      .getByRole("button", { name: /加粗$/u });
    await bold.dispatchEvent("pointerdown", { button: 0, isPrimary: true });
    await page.getByLabel("模型示例").selectOption("headings");
    await selectRange(page, 0, 1);
    const replacement = await characterDocument(page);
    await bold.evaluate((button: HTMLButtonElement) => button.click());
    await expect.poll(() => characterDocument(page)).toEqual(replacement);
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
    await bold.click();
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
    await page.getByRole("button", { name: "撤销", exact: true }).click();
    await expect.poll(() => characterDocument(page)).toEqual(replacement);
  });

  test(`honors a native canceled Toolbar click and then formats the current range at width ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await selectRange(page);
    const before = await characterDocument(page);
    const bold = page
      .getByRole("toolbar", { name: "固定格式工具栏" })
      .getByRole("button", { name: /加粗$/u });
    await bold.evaluate((button) =>
      button.addEventListener("click", (event) => event.preventDefault(), {
        once: true,
      }),
    );
    await bold.click();
    await expect.poll(() => characterDocument(page)).toEqual(before);
    await selectRange(page, 3, 4);
    await bold.evaluate((button: HTMLButtonElement) => button.click());
    const after = await characterDocument(page);
    expect(after.children[0].children).toContainEqual({
      type: "text",
      text: before.children[0].children[0].text.slice(3, 4),
      marks: { bold: true },
    });
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
  });
}
