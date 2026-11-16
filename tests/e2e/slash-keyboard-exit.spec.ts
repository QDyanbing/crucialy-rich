import { expect, test } from "@playwright/test";
import { characterDocument, setCharacterCaret } from "./character-helpers";

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
  test(`splits normally when a Slash query has no matches at width ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await setCharacterCaret(page, [0, 0], 0);
    await page.keyboard.type("/zzzz");
    const before = await characterDocument(page);
    await expect(page.getByRole("listbox", { name: "插入块菜单" })).toHaveCount(0);
    await page.keyboard.press("Enter");
    const after = await characterDocument(page);
    expect(after.children[0].children[0].text).toBe("/zzzz");
    expect(after.children).toHaveLength(before.children.length + 1);
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 2');
    await page.getByRole("button", { name: "撤销", exact: true }).click();
    await expect.poll(() => characterDocument(page)).toEqual(before);
    await page.getByRole("button", { name: "重做", exact: true }).click();
    await expect.poll(() => characterDocument(page)).toEqual(after);
  });

  for (const key of ["Tab", "Shift+Tab"]) {
    test(`dismisses Slash without trapping ${key} at width ${width}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/");
      await setCharacterCaret(page, [0, 0], 0);
      await page.keyboard.type("/h2");
      const menu = page.getByRole("listbox", { name: "插入块菜单" });
      await expect(menu).toBeVisible();
      const before = await characterDocument(page);
      await page.keyboard.press(key);
      await expect(menu).toHaveCount(0);
      await expect(page.getByLabel("已渲染文档")).not.toBeFocused();
      await expect.poll(() => characterDocument(page)).toEqual(before);
      await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
    });
  }
}

test("closes an old Slash menu when an image is selected", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("模型示例").selectOption("image-clipboard");
  await setCharacterCaret(page, [0, 0], 0);
  await page.keyboard.type("/h2");
  const menu = page.getByRole("listbox", { name: "插入块菜单" });
  await expect(menu).toBeVisible();
  const before = await characterDocument(page);
  await page.getByLabel("已渲染文档").locator("img").click();
  await expect(menu).toHaveCount(0);
  await page.keyboard.press("Enter");
  await expect.poll(() => characterDocument(page)).toEqual(before);
});

test("leaves a keyCode 229 Slash Enter to the IME", async ({ page }) => {
  await page.goto("/");
  await setCharacterCaret(page, [0, 0], 0);
  await page.keyboard.type("/h2");
  const before = await characterDocument(page);
  const prevented = await page.getByLabel("已渲染文档").evaluate((root) => {
    const event = new KeyboardEvent("keydown", {
      key: "Enter",
      keyCode: 229,
      bubbles: true,
      cancelable: true,
    });
    root.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(prevented).toBe(false);
  await expect.poll(() => characterDocument(page)).toEqual(before);
});
