import { expect, test, type Page } from "@playwright/test";
import { characterDocument, setCharacterCaret } from "./character-helpers";

const errors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const messages: string[] = [];
  errors.set(page, messages);
  page.on("pageerror", (error) => messages.push(error.message));
});
test.afterEach(({ page }) => expect(errors.get(page)).toEqual([]));

for (const key of ["Enter", "Space"]) {
  test(`discards an abandoned link pointer range before keyboard entry with ${key}`, async ({
    page,
  }) => {
    await page.goto("/");
    const opener = page.getByRole("button", { name: "链接", exact: true });
    await opener.dispatchEvent("pointerdown", { button: 0, isPrimary: true });
    await page.getByLabel("锚点偏移").fill("2");
    await page.getByLabel("焦点偏移").fill("4");
    await opener.focus();
    await page.keyboard.press(key);
    await page.getByRole("button", { name: "确认链接" }).click();
    await expect(page.getByLabel("已渲染文档").getByRole("link")).toHaveText("，c");
  });
}

for (const width of [1280, 390]) {
  for (const reverse of [false, true]) {
    test(`links a saved cross-block range with independent History at ${width}, reverse ${reverse}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/");
      await setCharacterCaret(page, [0, 0], 3);
      await page.getByLabel("已渲染文档").evaluate((root, backward) => {
        const first = root.querySelector('[data-crucialy-path="[0,0]"]')!.firstChild!;
        const last = root.querySelector('[data-crucialy-path="[1,0]"]')!.firstChild!;
        window
          .getSelection()!
          .setBaseAndExtent(
            backward ? last : first,
            backward ? 2 : 3,
            backward ? first : last,
            backward ? 3 : 2,
          );
        root.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      }, reverse);
      const before = await characterDocument(page);
      await page.getByRole("button", { name: "链接", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: "链接设置" });
      await expect(page.getByLabel("链接地址")).toBeFocused();
      await page.getByLabel("链接地址").fill("https://example.com/range");
      await dialog.scrollIntoViewIfNeeded();
      const bounds = await dialog.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      expect(
        await dialog.evaluate((root) => root.scrollWidth <= root.clientWidth),
      ).toBe(true);
      await dialog.screenshot({ path: test.info().outputPath("link-draft.png") });
      await page.getByLabel("链接地址").press("Enter");
      const after = await characterDocument(page);
      const links = page.getByLabel("已渲染文档").getByRole("link");
      await expect(links).toHaveCount(2);
      await expect(links.first()).toHaveText("crucialy-rich。");
      await expect(links.last()).toHaveText("选区");
      await expect(page.getByLabel("已渲染文档")).toBeFocused();
      await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
      await page.getByRole("button", { name: "撤销", exact: true }).click();
      await expect.poll(() => characterDocument(page)).toEqual(before);
      await expect(page.getByLabel("锚点路径")).toHaveValue(reverse ? "1,0" : "0,0");
      await expect(page.getByLabel("锚点偏移")).toHaveValue(reverse ? "2" : "3");
      await expect(page.getByLabel("焦点路径")).toHaveValue(reverse ? "0,0" : "1,0");
      await expect(page.getByLabel("焦点偏移")).toHaveValue(reverse ? "3" : "2");
      await expect
        .poll(() =>
          page.evaluate(() => {
            const selection = window.getSelection()!;
            return [
              selection.anchorNode?.parentElement
                ?.closest("[data-crucialy-path]")
                ?.getAttribute("data-crucialy-path"),
              selection.anchorOffset,
              selection.focusNode?.parentElement
                ?.closest("[data-crucialy-path]")
                ?.getAttribute("data-crucialy-path"),
              selection.focusOffset,
            ];
          }),
        )
        .toEqual(reverse ? ["[1,0]", 2, "[0,0]", 3] : ["[0,0]", 3, "[1,0]", 2]);
      await page.getByRole("button", { name: "重做", exact: true }).click();
      await expect.poll(() => characterDocument(page)).toEqual(after);
      await expect(dialog).toHaveCount(0);
    });
  }

  test(`leaves the nonmodal link dialog with Tab at width ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "链接", exact: true }).click();
    const before = await characterDocument(page);
    const dialog = page.getByRole("dialog", { name: "链接设置" });
    for (const label of ["链接打开方式", "链接 rel"]) {
      await page.keyboard.press("Tab");
      await expect(page.getByLabel(label)).toBeFocused();
    }
    await page.keyboard.press("Tab");
    await expect(
      dialog.getByRole("button", { name: "关闭", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(dialog.getByRole("button", { name: "确认链接" })).toBeFocused();
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((root) => root.contains(document.activeElement))).toBe(
      false,
    );
    await page.keyboard.press("Shift+Tab");
    await expect(dialog.getByRole("button", { name: "确认链接" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "链接", exact: true })).toBeFocused();
    await expect.poll(() => characterDocument(page)).toEqual(before);
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
  });
}

test("closes a text link draft when an image becomes selected", async ({ page }) => {
  await page.route("https://images.unsplash.com/**", (route) =>
    route.fulfill({ status: 204 }),
  );
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("image-clipboard");
  await page.getByRole("button", { name: "链接", exact: true }).click();
  const before = await characterDocument(page);
  await page.getByLabel("已渲染文档").locator("img").click();
  await expect(page.getByRole("dialog", { name: "链接设置" })).toHaveCount(0);
  await expect(page.getByLabel("已渲染文档")).toBeFocused();
  await expect.poll(() => characterDocument(page)).toEqual(before);
  await expect(page.getByRole("button", { name: "链接", exact: true })).toBeDisabled();
});
