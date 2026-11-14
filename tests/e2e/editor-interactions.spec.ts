import { expect, test } from "@playwright/test";
import { characterDocument, setCharacterCaret } from "./character-helpers";
import { compose } from "./composition-helpers";

test.beforeEach(async ({ page }) => {
  await page.route("https://images.unsplash.com/**", (route) =>
    route.fulfill({
      contentType: "image/png",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        "base64",
      ),
    }),
  );
});

for (const width of [1280, 390]) {
  test(`toggles a focused task with Space without editing stale text at width ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await page.getByLabel("模型示例").selectOption("advanced-lists");
    const editor = page.getByLabel("已渲染文档");
    const checkbox = editor.locator('input[data-crucialy-path="[1,0]"]');
    const before = await characterDocument(page);
    await setCharacterCaret(page, [0, 0, 0], 1);
    await checkbox.focus();
    await page.keyboard.press("Space");
    await expect(checkbox).toBeChecked();
    const expected = structuredClone(before);
    expected.children[1].children[0].checked = true;
    await expect.poll(() => characterDocument(page)).toEqual(expected);
    await expect(checkbox).toBeFocused();
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
    await page.keyboard.press("Space");
    await expect.poll(() => characterDocument(page)).toEqual(before);
    await expect(checkbox).toBeFocused();
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 2');
    await page.getByRole("button", { name: "撤销", exact: true }).click();
    await expect.poll(() => characterDocument(page)).toEqual(expected);
    await page.getByRole("button", { name: "撤销", exact: true }).click();
    await expect.poll(() => characterDocument(page)).toEqual(before);
    await page.getByRole("button", { name: "重做", exact: true }).click();
    await expect.poll(() => characterDocument(page)).toEqual(expected);
    await editor.screenshot({ path: test.info().outputPath("task-interaction.png") });
  });

  test(`honors a canceled task click then accepts the next click at width ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await page.getByLabel("模型示例").selectOption("advanced-lists");
    const checkbox = page
      .getByLabel("已渲染文档")
      .locator('input[data-crucialy-path="[1,0]"]');
    const before = await characterDocument(page);
    await checkbox.evaluate((element) =>
      element.addEventListener("click", (event) => event.preventDefault(), {
        once: true,
      }),
    );
    await checkbox.click();
    await expect.poll(() => characterDocument(page)).toEqual(before);
    await expect(checkbox).not.toBeChecked();
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
    await checkbox.click();
    await expect(checkbox).toBeChecked();
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
  });

  test(`keeps task clicks out of composition and resumes afterward at width ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await page.getByLabel("模型示例").selectOption("advanced-lists");
    const checkbox = page
      .getByLabel("已渲染文档")
      .locator('input[data-crucialy-path="[1,0]"]');
    const before = await characterDocument(page);
    await setCharacterCaret(page, [0, 0, 0], 1);
    await compose(page, "compositionstart");
    await expect(checkbox).toBeDisabled();
    await checkbox.evaluate((element: HTMLInputElement) => element.click());
    await expect.poll(() => characterDocument(page)).toEqual(before);
    await compose(page, "compositionend", "中");
    await expect(checkbox).toBeEnabled();
    const composed = await characterDocument(page);
    expect(composed.children[0].children[0].children[0].text).toBe("父中级项目");
    await checkbox.click();
    await expect(checkbox).toBeChecked();
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 2');
    await page.getByRole("button", { name: "撤销", exact: true }).click();
    await expect.poll(() => characterDocument(page)).toEqual(composed);
    await page.getByRole("button", { name: "撤销", exact: true }).click();
    await expect.poll(() => characterDocument(page)).toEqual(before);
  });

  test(`cancels image and cell selection notifications at width ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await page.getByLabel("模型示例").selectOption("images");
    const editor = page.getByLabel("已渲染文档");
    for (const [model, selector] of [
      ["images", "img"],
      ["tables", "td"],
    ]) {
      await page.getByLabel("模型示例").selectOption(model!);
      const target = editor.locator(selector!).first();
      const before = await characterDocument(page);
      await target.evaluate((element) =>
        element.addEventListener("click", (event) => event.preventDefault(), {
          once: true,
        }),
      );
      await target.click();
      await expect(target).not.toHaveAttribute("data-selected", "true");
      await expect.poll(() => characterDocument(page)).toEqual(before);
      await target.click();
      await expect(target).toHaveAttribute("data-selected", "true");
      await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
    }
  });
}
