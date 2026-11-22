import { expect, test } from "@playwright/test";
import { characterDocument, setCharacterCaret } from "./character-helpers";
const rules = [
  { prefix: "#", type: "heading" },
  { prefix: ">", type: "quote" },
  { prefix: "-", type: "bulletList" },
  { prefix: "1.", type: "orderedList" },
  { prefix: "``", type: "codeBlock" },
];
for (const width of [1280, 390]) {
  for (const { prefix, type } of rules) {
    test(`retains suffix with ${type} input rule at ${width}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/");
      const original = await characterDocument(page);
      await setCharacterCaret(page, [0, 0], 0);
      await page.keyboard.type(prefix);
      const before = await characterDocument(page);
      await page.keyboard.press(type === "codeBlock" ? "Backquote" : "Space");
      const after = await characterDocument(page);
      expect(after.children[0].type).toBe(type);
      const children = type.endsWith("List")
        ? after.children[0].children[0].children
        : after.children[0].children;
      expect(children.map((node: { text: string }) => node.text).join("")).toBe(
        "你好，crucialy-rich。",
      );
      expect(after.children[1]).toEqual(original.children[1]);
      await page
        .getByLabel("已渲染文档")
        .screenshot({ path: test.info().outputPath("input-rule-suffix.png") });
      await page.getByRole("button", { name: "撤销", exact: true }).click();
      await expect.poll(() => characterDocument(page)).toEqual(before);
      await page.getByRole("button", { name: "重做", exact: true }).click();
      await expect.poll(() => characterDocument(page)).toEqual(after);
      expect(errors).toEqual([]);
    });
  }
}
