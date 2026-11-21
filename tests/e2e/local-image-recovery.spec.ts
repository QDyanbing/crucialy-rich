import { expect, test } from "@playwright/test";
import { characterDocument, setCharacterCaret } from "./character-helpers";
const file = {
  name: "恢复.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  ),
};
for (const width of [1280, 390]) {
  for (const failure of ["throw", "wrong-protocol"]) {
    test(`recovers local image allocation ${failure} at width ${width}`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: 844 });
      await page.addInitScript((mode) => {
        const allocate = URL.createObjectURL.bind(URL);
        let first = true;
        URL.createObjectURL = (blob) => {
          if (first) {
            first = false;
            if (mode === "throw") throw new Error("allocation");
            return "https://example.com/not-local.png";
          }
          return allocate(blob);
        };
      }, failure);
      await page.goto("/");
      await setCharacterCaret(page, [0, 0], 1);
      await page.getByLabel("已渲染文档").dispatchEvent("mouseup");
      const before = await characterDocument(page);
      const input = page.getByLabel("选择本地图片");
      await input.setInputFiles(file);
      await expect(input).toHaveValue("");
      await expect.poll(() => characterDocument(page)).toEqual(before);
      await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
      await input.setInputFiles(file);
      const image = page.getByLabel("已渲染文档").getByRole("img", { name: file.name });
      await expect
        .poll(() => image.evaluate((node: HTMLImageElement) => node.naturalWidth))
        .toBe(1);
      await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
      await page
        .getByLabel("已渲染文档")
        .screenshot({ path: test.info().outputPath("local-recovery.png") });
      expect(errors).toEqual([]);
    });
  }
}
