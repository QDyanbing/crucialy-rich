import { expect, test } from "@playwright/test";
import { setCharacterCaret, characterDocument } from "./character-helpers";
import { compose } from "./composition-helpers";

const file = {
  name: "图片.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  ),
};
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    let allocations = 0;
    const allocate = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (blob) => {
      allocations++;
      return allocate(blob);
    };
    Object.defineProperty(window, "imageAllocations", { get: () => allocations });
  });
  await page.goto("/");
});
test("does not allocate for an unavailable image insertion context", async ({
  page,
}) => {
  const before = await characterDocument(page);
  await page.getByLabel("选择本地图片").setInputFiles(file);
  expect(await page.evaluate(() => Reflect.get(window, "imageAllocations"))).toBe(0);
  await expect.poll(() => characterDocument(page)).toEqual(before);
  await expect(page.getByLabel("选择本地图片")).toHaveValue("");
});
test("does not allocate during composition and permits the same file afterward", async ({
  page,
}) => {
  await setCharacterCaret(page, [0, 0], 0);
  await page.getByLabel("已渲染文档").dispatchEvent("mouseup");
  await compose(page, "compositionstart");
  const before = await characterDocument(page);
  await page.getByLabel("选择本地图片").setInputFiles(file);
  expect(await page.evaluate(() => Reflect.get(window, "imageAllocations"))).toBe(0);
  await expect.poll(() => characterDocument(page)).toEqual(before);
  await compose(page, "compositionend");
  await page.getByLabel("选择本地图片").setInputFiles(file);
  expect(await page.evaluate(() => Reflect.get(window, "imageAllocations"))).toBe(1);
  await expect(page.getByLabel("已渲染文档").getByRole("img")).toBeVisible();
});
