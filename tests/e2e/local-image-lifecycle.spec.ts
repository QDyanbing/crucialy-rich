import { expect, test } from "@playwright/test";
import { characterDocument, setCharacterCaret } from "./character-helpers";

const file = {
  name: "本地预览.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  ),
};

test("keeps local image URLs alive through rerenders and History", async ({ page }) => {
  await page.goto("/");
  await setCharacterCaret(page, [0, 0], 3);
  await page.getByLabel("已渲染文档").dispatchEvent("mouseup");
  const before = await characterDocument(page);
  await page.getByLabel("选择本地图片").setInputFiles(file);
  const image = page.getByLabel("已渲染文档").getByRole("img", { name: file.name });
  await expect(image).toBeVisible();
  const src = await image.getAttribute("src");
  expect(src).toMatch(/^blob:/u);
  const readable = () =>
    page.evaluate(async (url) => {
      try {
        return (await fetch(url!)).ok;
      } catch {
        return false;
      }
    }, src);
  expect(await readable()).toBe(true);
  await page.getByRole("checkbox", { name: "显示固定工具栏" }).uncheck();
  await page.getByLabel("图片地址").fill("https://example.com/changed.png");
  expect(await readable()).toBe(true);
  await expect
    .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
    .toBe(1);
  const after = await characterDocument(page);
  await page.getByRole("button", { name: "撤销", exact: true }).click();
  await expect.poll(() => characterDocument(page)).toEqual(before);
  expect(await readable()).toBe(true);
  await page.getByRole("button", { name: "重做", exact: true }).click();
  await expect.poll(() => characterDocument(page)).toEqual(after);
  await expect(image).toHaveAttribute("src", src!);
  expect(await readable()).toBe(true);
});

test("does not insert a local file when the current image command is unavailable", async ({
  page,
}) => {
  await page.goto("/");
  const before = await characterDocument(page);
  await page.getByLabel("选择本地图片").setInputFiles(file);
  await expect.poll(() => characterDocument(page)).toEqual(before);
  await expect(page.getByLabel("已渲染文档").locator("img")).toHaveCount(0);
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
  await expect(page.getByLabel("选择本地图片")).toHaveValue("");
});
