import { expect, test } from "@playwright/test";
import { setCharacterCaret } from "./character-helpers";
const buffer = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);
for (const width of [1280, 390]) {
  test(`retains independent local image resources through History at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await setCharacterCaret(page, [0, 0], 1);
    await page.getByLabel("已渲染文档").dispatchEvent("mouseup");
    const input = page.getByLabel("选择本地图片");
    await input.setInputFiles({ name: "第一张.png", mimeType: "image/png", buffer });
    await input.setInputFiles({ name: "第二张.png", mimeType: "image/png", buffer });
    const images = page.getByLabel("已渲染文档").getByRole("img");
    await expect(images).toHaveCount(2);
    const urls = await images.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("src")!),
    );
    expect(new Set(urls).size).toBe(2);
    const readable = () =>
      page.evaluate(
        async (sources) =>
          Promise.all(sources.map(async (url) => (await fetch(url)).ok)),
        urls,
      );
    expect(await readable()).toEqual([true, true]);
    await page.getByRole("button", { name: "撤销", exact: true }).click();
    await expect(images).toHaveCount(1);
    expect(await readable()).toEqual([true, true]);
    await page.getByRole("button", { name: "重做", exact: true }).click();
    await expect(images).toHaveCount(2);
    expect(
      await images.evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("src")!),
      ),
    ).toEqual(urls);
    await input.setInputFiles([]);
    expect(await readable()).toEqual([true, true]);
  });
}
