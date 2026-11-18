import { expect, test } from "@playwright/test";
import { characterDocument, setCharacterCaret } from "./character-helpers";

test("focuses the link address once and returns to the opener on close", async ({
  page,
}) => {
  await page.goto("/");
  const opener = page.getByRole("button", { name: "链接", exact: true });
  const before = await characterDocument(page);
  await opener.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("链接地址")).toBeFocused();
  await page.getByLabel("链接 rel").focus();
  await page.keyboard.type(" nofollow");
  await expect(page.getByLabel("链接 rel")).toBeFocused();
  await page.getByRole("button", { name: "关闭", exact: true }).click();
  await expect(opener).toBeFocused();
  await expect(opener).toHaveAttribute("aria-expanded", "false");
  await expect.poll(() => characterDocument(page)).toEqual(before);
});

test("keeps focus on new editing intent when the saved link document expires", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "链接", exact: true }).click();
  await setCharacterCaret(page, [1, 0], 1);
  await page.keyboard.type("X");
  await expect(page.getByRole("dialog", { name: "链接设置" })).toHaveCount(0);
  await expect(page.getByLabel("已渲染文档")).toBeFocused();
});

test("returns to the restored text range after link confirmation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "链接", exact: true }).click();
  await page.getByLabel("链接地址").fill("https://example.com/focus");
  await page.getByRole("button", { name: "确认链接" }).click();
  await expect(page.getByLabel("已渲染文档")).toBeFocused();
  await expect
    .poll(() => page.evaluate(() => window.getSelection()?.toString()))
    .toBe("你好，cr");
  await page.keyboard.type("新");
  const after = await characterDocument(page);
  expect(
    after.children[0].children.map((node: { text: string }) => node.text).join(""),
  ).toBe("新ucialy-rich。");
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 2');
});
