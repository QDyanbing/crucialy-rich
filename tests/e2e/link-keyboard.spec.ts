import { expect, test } from "@playwright/test";
import { characterDocument } from "./character-helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "链接", exact: true }).click();
});

for (const label of ["链接地址", "链接 rel"]) {
  test(`confirms a link once with Enter from ${label}`, async ({ page }) => {
    await page.getByLabel(label).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: "链接设置" })).toHaveCount(0);
    await expect(page.getByLabel("已渲染文档")).toBeFocused();
    await expect(page.getByLabel("已渲染文档").getByRole("link")).toHaveText(
      "你好，cr",
    );
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
  });
}

test("closes with Escape and leaves document and History unchanged", async ({
  page,
}) => {
  const before = await characterDocument(page);
  const opener = page.getByRole("button", { name: "链接", exact: true });
  await expect(opener).toHaveAttribute("aria-controls", "demo-link-settings");
  await page.getByLabel("链接地址").fill("https://example.com/draft");
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
  await expect(opener).not.toHaveAttribute("aria-controls");
  await expect(page.getByRole("dialog", { name: "链接设置" })).toHaveCount(0);
  await expect.poll(() => characterDocument(page)).toEqual(before);
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
});

test("keeps an invalid draft open for correction after Enter", async ({ page }) => {
  const before = await characterDocument(page);
  await page.getByLabel("链接地址").fill("javascript:alert(1)");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "链接设置" })).toBeVisible();
  await expect(page.getByLabel("链接地址")).toBeFocused();
  await expect.poll(() => characterDocument(page)).toEqual(before);
  await page.getByLabel("链接地址").fill("https://example.com/fixed");
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("已渲染文档").getByRole("link")).toHaveAttribute(
    "href",
    "https://example.com/fixed",
  );
});

for (const key of ["Enter", "Escape"]) {
  for (const guard of ["composing", "legacy", "modified", "canceled"]) {
    test(`leaves ${guard} ${key} untouched inside a link draft`, async ({ page }) => {
      const before = await characterDocument(page);
      const prevented = await page.getByLabel("链接地址").evaluate(
        (input, args) => {
          if (args.guard === "canceled")
            input.addEventListener("keydown", (event) => event.preventDefault(), {
              once: true,
            });
          const event = new KeyboardEvent("keydown", {
            key: args.key,
            bubbles: true,
            cancelable: true,
            isComposing: args.guard === "composing",
            keyCode: args.guard === "legacy" ? 229 : 0,
            ctrlKey: args.guard === "modified",
          });
          input.dispatchEvent(event);
          return event.defaultPrevented;
        },
        { key, guard },
      );
      expect(prevented).toBe(guard === "canceled");
      await expect(page.getByRole("dialog", { name: "链接设置" })).toBeVisible();
      await expect.poll(() => characterDocument(page)).toEqual(before);
      await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
    });
  }
}
