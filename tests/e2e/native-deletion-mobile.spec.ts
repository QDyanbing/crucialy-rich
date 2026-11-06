import { expect, test } from "@playwright/test";
import { characterDocument, setCharacterCaret } from "./character-helpers";
import { nativeDelete } from "./native-input-helpers";

for (const type of ["deleteContentBackward", "deleteContentForward"]) {
  for (const context of ["task", "cell"]) {
    test(`keeps ${context} structure through mobile native ${type}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/");
      await page
        .getByLabel("模型示例")
        .selectOption(context === "task" ? "list-clipboard" : "table-clipboard");
      const path = context === "task" ? [2, 1, 0] : [0, 0, 1, 1, 0];
      const editor = page.getByLabel("已渲染文档");
      await editor.evaluate((root, path) => {
        (root as HTMLElement).focus();
        const text = root.querySelector(
          `[data-crucialy-path="${JSON.stringify(path)}"]`,
        )!.firstChild!;
        window
          .getSelection()!
          .setBaseAndExtent(text, 0, text, text.textContent!.length);
      }, path);
      await page.keyboard.insertText("A\u{1f600}B");
      const before = await characterDocument(page);
      await setCharacterCaret(page, path, type === "deleteContentBackward" ? 3 : 1);
      expect(await nativeDelete(page, type)).toBe(true);
      const expected = structuredClone(before);
      let text = expected;
      for (const index of path) text = text.children[index];
      text.text = "AB";
      await expect.poll(() => characterDocument(page)).toEqual(expected);
      await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 2');
      if (context === "task")
        await expect(
          editor.locator('[data-crucialy-path="[2,1]"] input'),
        ).toBeChecked();
      await page.getByRole("button", { name: "撤销", exact: true }).click();
      await expect.poll(() => characterDocument(page)).toEqual(before);
      await page.getByRole("button", { name: "重做", exact: true }).click();
      await expect.poll(() => characterDocument(page)).toEqual(expected);
      await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
    });
  }

  test(`restores and deletes a selected image through mobile native ${type}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
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
    const editor = page.getByLabel("已渲染文档");
    const image = editor.locator("img");
    const before = await characterDocument(page);
    await image.click();
    await editor.focus();
    await editor.evaluate(() => window.getSelection()!.removeAllRanges());
    expect(await nativeDelete(page, type)).toBe(true);
    await expect(image).toHaveCount(0);
    const expected = structuredClone(before);
    expected.children.splice(2, 1);
    await expect.poll(() => characterDocument(page)).toEqual(expected);
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
    const undo = page.getByRole("button", { name: "撤销", exact: true });
    await undo.click();
    await expect(image).toHaveAttribute("data-selected", "true");
    await expect.poll(() => characterDocument(page)).toEqual(before);
    await expect
      .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
      .toBeGreaterThan(0);
    const bounds = (await image.boundingBox())!;
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
    await editor.screenshot({
      path: test.info().outputPath("native-image-mobile.png"),
    });
    await editor.focus();
    await editor.evaluate(() => window.getSelection()!.removeAllRanges());
    expect(await nativeDelete(page, type)).toBe(true);
    await expect(image).toHaveCount(0);
    await undo.click();
    await page.getByRole("button", { name: "重做", exact: true }).click();
    await expect.poll(() => characterDocument(page)).toEqual(expected);
    await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
  });
}
