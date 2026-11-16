import { expect, test, type Page } from "@playwright/test";
import { characterDocument, setCharacterCaret } from "./character-helpers";

const testErrors = new WeakMap<Page, string[]>();

async function settle(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

async function alignWithCaret(page: Page) {
  await settle(page);
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const range = window.getSelection()?.getRangeAt(0).getBoundingClientRect();
        const menu = document.querySelector(".crucialy-floating-slash-menu");
        if (!range || !menu) return false;
        const height = Math.min(320, innerHeight - 16);
        const candidate =
          range.bottom + 6 + height > innerHeight - 8
            ? range.top - height - 6
            : range.bottom + 6;
        const expected = Math.max(8, Math.min(candidate, innerHeight - height - 8));
        const bounds = menu.getBoundingClientRect();
        return (
          Math.abs(bounds.top - expected) < 1 &&
          bounds.left >= 8 &&
          bounds.right <= innerWidth - 8
        );
      }),
    )
    .toBe(true);
}

async function selectText(page: Page) {
  await setCharacterCaret(page, [0, 0], 1);
  await page.getByLabel("已渲染文档").evaluate((root) => {
    const text = root.querySelector('[data-crucialy-path="[0,0]"]')!.firstChild!;
    window.getSelection()!.setBaseAndExtent(text, 1, text, 3);
    root.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  });
}

for (const width of [1280, 390]) {
  test.describe(`viewport ${width}`, () => {
    test.beforeEach(async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/");
      testErrors.set(page, errors);
    });

    test.afterEach(({ page }) => expect(testErrors.get(page)).toEqual([]));

    test(`scrolls only Slash options to reveal the active item at width ${width}`, async ({
      page,
    }) => {
      await setCharacterCaret(page, [0, 0], 0);
      await page.keyboard.type("/");
      const menu = page.locator(".crucialy-floating-slash-menu");
      await expect(menu).toBeVisible();
      const before = await characterDocument(page);
      const history = await page.getByLabel("History 状态").textContent();
      const scroll = await page.evaluate(() => scrollY);
      await menu.evaluate((root) => {
        root.scrollTop = 40;
      });
      await settle(page);
      expect(await menu.evaluate((root) => root.scrollTop)).toBe(40);
      await page.keyboard.press("ArrowUp");
      const active = menu.locator('[aria-selected="true"]');
      await expect(active).toHaveText(
        (await menu.getByRole("option").last().textContent()) ?? "",
      );
      await expect
        .poll(() =>
          active.evaluate((item) => {
            const parent = item.closest(".crucialy-floating-slash-menu")!;
            const bounds = parent.getBoundingClientRect();
            const option = item.getBoundingClientRect();
            return (
              option.top >= bounds.top + parent.clientTop - 1 &&
              option.bottom <= bounds.top + parent.clientTop + parent.clientHeight + 1
            );
          }),
        )
        .toBe(true);
      expect(await page.evaluate(() => scrollY)).toBe(scroll);
      await expect(page.getByLabel("已渲染文档")).toBeFocused();
      await expect.poll(() => characterDocument(page)).toEqual(before);
      await expect(page.getByLabel("History 状态")).toHaveText(history!);
      await menu.screenshot({
        path: test.info().outputPath("slash-active-option.png"),
      });
    });

    test(`refreshes Slash on scroll and resize and restores visible anchors at width ${width}`, async ({
      page,
    }) => {
      await setCharacterCaret(page, [0, 0], 0);
      await page.keyboard.type("/h2");
      const menu = page.getByRole("listbox", { name: "插入块菜单" });
      await expect(menu).toBeVisible();
      const before = await characterDocument(page);
      const history = await page.getByLabel("History 状态").textContent();
      await page.evaluate(() => {
        const rect = window.getSelection()!.getRangeAt(0).getBoundingClientRect();
        window.scrollBy(0, rect.top - 300);
      });
      await alignWithCaret(page);
      await page.setViewportSize({ width: width === 390 ? 360 : 1000, height: 600 });
      await page
        .getByLabel("已渲染文档")
        .locator('[data-crucialy-path="[0,0]"]')
        .scrollIntoViewIfNeeded();
      await alignWithCaret(page);
      const visibleScroll = await page.evaluate(() => scrollY);
      await page.evaluate(() => {
        const rect = window.getSelection()!.getRangeAt(0).getBoundingClientRect();
        window.scrollBy(0, rect.bottom + 100);
      });
      await expect(menu).toHaveCount(0);
      await page.evaluate((top) => window.scrollTo(0, top), visibleScroll);
      await expect(menu).toBeVisible();
      await alignWithCaret(page);
      await expect.poll(() => characterDocument(page)).toEqual(before);
      await expect(page.getByLabel("History 状态")).toHaveText(history!);
      await page.screenshot({ path: test.info().outputPath("slash-resized.png") });
    });

    test(`hides Slash outside editor focus without changing its query at width ${width}`, async ({
      page,
    }) => {
      await setCharacterCaret(page, [0, 0], 0);
      await page.keyboard.type("/h2");
      const menu = page.getByRole("listbox", { name: "插入块菜单" });
      await expect(menu).toBeVisible();
      const before = await characterDocument(page);
      await page.getByLabel("模型示例").focus();
      await expect(menu).toHaveCount(0);
      await page
        .getByLabel("已渲染文档")
        .locator('[data-crucialy-path="[0,0]"]')
        .scrollIntoViewIfNeeded();
      await page.getByLabel("已渲染文档").focus();
      await expect(menu).toBeVisible();
      await expect(menu.getByRole("option")).toContainText("2 级标题");
      await expect.poll(() => characterDocument(page)).toEqual(before);
    });

    test(`refreshes a floating toolbar and clears foreign selection at width ${width}`, async ({
      page,
    }) => {
      await selectText(page);
      const toolbar = page.locator(".crucialy-floating-toolbar");
      await expect(toolbar).toBeVisible();
      const before = await characterDocument(page);
      const history = await page.getByLabel("History 状态").textContent();
      await page.evaluate(() => {
        const rect = window.getSelection()!.getRangeAt(0).getBoundingClientRect();
        window.scrollBy(0, rect.top - 300);
      });
      await settle(page);
      await expect
        .poll(() =>
          toolbar.evaluate((root) => {
            const range = window.getSelection()!.getRangeAt(0).getBoundingClientRect();
            return Math.abs(root.getBoundingClientRect().top - (range.top - 48)) < 1;
          }),
        )
        .toBe(true);
      await page.setViewportSize({ width: width === 390 ? 280 : 1000, height: 600 });
      await page
        .getByLabel("已渲染文档")
        .locator('[data-crucialy-path="[0,0]"]')
        .scrollIntoViewIfNeeded();
      await settle(page);
      const bounds = await toolbar.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(8);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(
        (width === 390 ? 280 : 1000) - 8,
      );
      await toolbar.screenshot({ path: test.info().outputPath("toolbar-resized.png") });
      await page.evaluate(() => {
        const text = document.querySelector("h1")!.firstChild!;
        window.getSelection()!.setBaseAndExtent(text, 0, text, 1);
      });
      await expect(toolbar).toHaveCount(0);
      await selectText(page);
      await expect(toolbar).toBeVisible();
      await expect.poll(() => characterDocument(page)).toEqual(before);
      await expect(page.getByLabel("History 状态")).toHaveText(history!);
    });
  });
}
