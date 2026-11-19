import { expect, test } from "@playwright/test";

const fixture = "/tests/ref-editor.html";
for (const width of [1280, 390]) {
  for (const controlled of [false, true]) {
    test.describe(`ref browser width ${width}, controlled ${controlled}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width, height: 844 });
        await page.route("https://example.com/ref.png", (route) =>
          route.fulfill({
            contentType: "image/png",
            body: Buffer.from(
              "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
              "base64",
            ),
          }),
        );
        await page.goto(`${fixture}?controlled=${controlled}`);
      });
      test("does not mutate the model or host range through a getter", async ({
        page,
      }) => {
        await page.getByRole("button", { name: "检查选区副本" }).click();
        const range = {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 2 },
        };
        await expect(page.getByLabel("读取选区")).toHaveText(JSON.stringify(range));
        await expect(page.getByLabel("文字选区")).toHaveText(JSON.stringify(range));
        await expect(page.getByLabel("文字通知")).toHaveText(
          '{"changes":0,"transactions":0}',
        );
      });
      test("isolates transaction mutation and continues native typing after a ref command", async ({
        page,
      }) => {
        await page.getByRole("checkbox", { name: "修改事务通知" }).check();
        await page.getByRole("button", { name: "加粗", exact: true }).click();
        const editor = page.getByLabel("命令文字编辑器");
        await expect(editor.locator("strong")).toHaveText("命令");
        expect(
          JSON.parse((await page.getByLabel("文字选区").textContent())!).anchor.offset,
        ).toBeLessThan(99);
        await editor.screenshot({ path: test.info().outputPath("ref-command.png") });
        await editor.focus();
        await page.keyboard.type("X");
        await expect(editor).toHaveText("X式正文");
        await expect(page.getByLabel("文字通知")).toHaveText(
          '{"changes":2,"transactions":2}',
        );
      });
      test("deletes an image through its payload without an old text selection", async ({
        page,
      }) => {
        const image = page.getByLabel("命令图片编辑器").getByRole("img");
        await expect
          .poll(() => image.evaluate((node: HTMLImageElement) => node.naturalWidth))
          .toBe(1);
        await page.getByRole("button", { name: "删除图片", exact: true }).click();
        await expect(image).toHaveCount(0);
        const event = JSON.parse((await page.getByLabel("图片事务").textContent())!);
        expect(event.inputType).toBe("command");
        expect(event).not.toHaveProperty("beforeSelection");
        expect(event.after.children).toEqual([
          { type: "paragraph", children: [{ type: "text", text: "" }] },
        ]);
      });
    });
  }
}
