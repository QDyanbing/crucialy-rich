import { expect, test } from "@playwright/test";
import { characterDocument, setCharacterCaret } from "./character-helpers";
import { compose } from "./composition-helpers";

for (const mode of ["caret", "forward-range", "backward-range"]) {
  test(`commits composition once and restores ${mode} History`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    const editor = page.getByLabel("已渲染文档");
    const before = await characterDocument(page);
    await setCharacterCaret(page, [0, 0], 1);
    if (mode !== "caret")
      await editor.evaluate((root, reverse) => {
        const first = root.querySelector('[data-crucialy-path="[0,0]"]')!.firstChild!;
        const last = root.querySelector('[data-crucialy-path="[1,0]"]')!.firstChild!;
        window
          .getSelection()!
          .setBaseAndExtent(reverse ? last : first, 1, reverse ? first : last, 1);
      }, mode === "backward-range");
    await compose(page, "compositionstart");
    await expect(editor).toHaveAttribute("data-composing", "true");
    await compose(page, "compositionupdate", "中文");
    await compose(page, "compositionupdate", "中");
    await expect.poll(() => characterDocument(page)).toEqual(before);
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
    await compose(page, "compositionend", "确认");
    const expected = structuredClone(before);
    expected.children[0].children[0].text =
      before.children[0].children[0].text.slice(0, 1) +
      "确认" +
      (mode === "caret"
        ? before.children[0].children[0].text.slice(1)
        : before.children[1].children[0].text.slice(1));
    if (mode !== "caret") expected.children.splice(1, 1);
    await expect.poll(() => characterDocument(page)).toEqual(expected);
    await expect(editor).toHaveAttribute("data-composing", "false");
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
    await page.getByRole("button", { name: "撤销", exact: true }).click();
    await expect.poll(() => characterDocument(page)).toEqual(before);
    if (mode === "backward-range")
      await expect(page.getByLabel("锚点路径")).toHaveValue("1,0");
    await page.getByRole("button", { name: "重做", exact: true }).click();
    await expect.poll(() => characterDocument(page)).toEqual(expected);
    await editor.focus();
    await page.keyboard.insertText("新");
    await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 2');
    await page.getByRole("button", { name: "撤销", exact: true }).click();
    await expect.poll(() => characterDocument(page)).toEqual(expected);
    await expect(page.getByLabel("模型校验状态")).toHaveText("合法");
    expect(errors).toEqual([]);
    if (mode === "caret")
      await editor.screenshot({
        path: test.info().outputPath("composition-desktop.png"),
      });
  });
}

test("clears a DOM-canceled composition end without inserting fallback text", async ({
  page,
}) => {
  await page.goto("/");
  const before = await characterDocument(page);
  const editor = page.getByLabel("已渲染文档");
  await setCharacterCaret(page, [0, 0], 1);
  await editor.evaluate((root) =>
    root.addEventListener("compositionend", (event) => event.preventDefault(), {
      once: true,
    }),
  );
  await compose(page, "compositionstart");
  await compose(page, "compositionend", "取消");
  await expect.poll(() => characterDocument(page)).toEqual(before);
  await expect(editor).toHaveAttribute("data-composing", "false");
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
  await page.keyboard.insertText("新");
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
});

test("does not replay an old candidate after changing the Demo model", async ({
  page,
}) => {
  await page.goto("/");
  await setCharacterCaret(page, [0, 0], 1);
  await compose(page, "compositionstart");
  await compose(page, "compositionupdate", "旧候选");
  await page.getByLabel("模型示例").selectOption("headings");
  const replacement = await characterDocument(page);
  const editor = page.getByLabel("已渲染文档");
  await expect(editor).toHaveAttribute("data-composing", "false");
  await compose(page, "compositionend", "不应写入");
  await expect.poll(() => characterDocument(page)).toEqual(replacement);
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
  await setCharacterCaret(page, [0, 0], 1);
  await compose(page, "compositionstart");
  await compose(page, "compositionend", "新");
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
});

test("ignores empty and delayed unpaired ends", async ({ page }) => {
  await page.goto("/");
  const before = await characterDocument(page);
  await setCharacterCaret(page, [0, 0], 1);
  await compose(page, "compositionstart");
  await compose(page, "compositionend", "");
  await compose(page, "compositionend", "迟到");
  await expect.poll(() => characterDocument(page)).toEqual(before);
  await expect(page.getByLabel("已渲染文档")).toHaveAttribute(
    "data-composing",
    "false",
  );
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
});
