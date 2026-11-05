import { expect, test } from "@playwright/test";
import { characterDocument, setCharacterCaret } from "./character-helpers";

for (const key of ["Backspace", "Delete"]) {
  test(`deletes across formatting without a premature merge on mobile (${key})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const editor = page.getByLabel("已渲染文档");
    await editor.evaluate((root) => {
      (root as HTMLElement).focus();
      const text = root.querySelector('[data-crucialy-path="[0,0]"]')!.firstChild!;
      window.getSelection()!.setBaseAndExtent(text, 0, text, text.textContent!.length);
      const clipboardData = new DataTransfer();
      clipboardData.setData(
        "text/html",
        '<p><strong>Ae</strong><em>\u0301</em><a href="https://example.com/">B</a></p>',
      );
      root.dispatchEvent(
        new ClipboardEvent("paste", { clipboardData, bubbles: true, cancelable: true }),
      );
    });
    await expect(editor.locator("p").filter({ hasText: "Ae\u0301B" })).toHaveCount(1);
    const before = await characterDocument(page);
    const index = before.children.findIndex(
      (block: { type: string; children: { text?: string }[] }) =>
        block.type === "paragraph" &&
        block.children.map((node) => node.text).join("") === "Ae\u0301B",
    );
    expect(index).toBeGreaterThanOrEqual(0);
    await setCharacterCaret(page, key === "Backspace" ? [index, 1] : [index, 0], 1);
    await page.keyboard.press(key);
    await expect(editor.locator("p").filter({ hasText: /^AB$/ })).toHaveCount(1);
    const after = await characterDocument(page);
    const expected = structuredClone(before);
    expected.children[index].children = [
      { type: "text", text: "A", marks: { bold: true } },
      before.children[index].children[2],
    ];
    expect(after).toEqual(expected);
    await expect(editor.locator("a").first()).toHaveAttribute(
      "href",
      "https://example.com/",
    );
    await page.getByRole("button", { name: "撤销", exact: true }).click();
    await expect.poll(() => characterDocument(page)).toEqual(before);
    await page.getByRole("button", { name: "重做", exact: true }).click();
    await expect.poll(() => characterDocument(page)).toEqual(after);
    const bounds = (await editor.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
    await editor.screenshot({ path: test.info().outputPath("grapheme-mobile.png") });
  });

  for (const context of ["task", "cell"]) {
    test(`deletes a whole grapheme in ${context} without changing neighbors (${key}, mobile)`, async ({
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
        const node = root.querySelector(
          `[data-crucialy-path="${JSON.stringify(path)}"]`,
        )!.firstChild!;
        window
          .getSelection()!
          .setBaseAndExtent(node, 0, node, node.textContent!.length);
      }, path);
      await page.keyboard.insertText("A\u{1f469}\u200d\u{1f4bb}B");
      const before = await characterDocument(page);
      await setCharacterCaret(page, path, key === "Backspace" ? 6 : 1);
      await page.keyboard.press(key);
      const expected = structuredClone(before);
      let text = expected;
      for (const index of path) text = text.children[index];
      text.text = "AB";
      await expect.poll(() => characterDocument(page)).toEqual(expected);
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
}
