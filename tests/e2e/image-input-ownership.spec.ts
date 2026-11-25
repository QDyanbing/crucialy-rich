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
  await setCharacterCaret(page, [0, 0], 1);
  const editor = page.getByLabel("已渲染文档");
  await editor.dispatchEvent("mouseup");
  await editor.getByRole("img").click();
  await expect(editor.getByRole("img")).toHaveAttribute("data-selected", "true");
  await editor.evaluate((root) => {
    const text = root.querySelector('[data-crucialy-path="[0,0]"]')!.firstChild!;
    window.getSelection()!.setBaseAndExtent(text, 1, text, 1);
  });
  return editor;
}
for (const width of [1280, 390]) {
  test(`isolates selected image input and resumes text editing at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const editor = await prepare(page);
    const before = await characterDocument(page);
    for (const key of ["X", "Space", "ControlOrMeta+b", "ControlOrMeta+Alt+2"]) {
      await page.keyboard.press(key);
      await expect.poll(() => characterDocument(page)).toEqual(before);
      await expect(editor.getByRole("img")).toHaveAttribute("data-selected", "true");
    }
    for (const type of ["text/plain", "text/html"]) {
      const prevented = await editor.evaluate((root, type) => {
        const clipboardData = new DataTransfer();
        clipboardData.setData(type, type === "text/plain" ? "替换" : "<p>替换</p>");
        const event = new ClipboardEvent("paste", {
          clipboardData,
          bubbles: true,
          cancelable: true,
        });
        root.dispatchEvent(event);
        return event.defaultPrevented;
      }, type);
      expect(prevented).toBe(true);
      await expect.poll(() => characterDocument(page)).toEqual(before);
    }
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
    await editor.screenshot({
      path: test.info().outputPath("selected-image-input.png"),
    });
    await editor.locator('[data-crucialy-path="[0,0]"]').click();
    await setCharacterCaret(page, [0, 0], 1);
    await page.keyboard.type("X");
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
    expect(await characterDocument(page)).not.toEqual(before);
    expect(errors).toEqual([]);
  });
  test(`keeps image deletion and undo available after blocked input at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    const editor = await prepare(page);
    const before = await characterDocument(page);
    await page.keyboard.type("X");
    await page.keyboard.press("Delete");
    await expect(editor.getByRole("img")).toHaveCount(0);
    await page.getByRole("button", { name: "撤销", exact: true }).click();
    await expect.poll(() => characterDocument(page)).toEqual(before);
    await expect(editor.getByRole("img")).toHaveAttribute("data-selected", "true");
  });
}
