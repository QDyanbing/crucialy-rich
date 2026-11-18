import { expect, test } from "@playwright/test";

test("does not enable a collapsed saved range when the current selection grows", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("焦点偏移").fill("0");
  await page.getByRole("button", { name: "链接", exact: true }).click();
  await page.getByLabel("焦点偏移").fill("5");
  await expect(page.getByRole("button", { name: "确认链接" })).toBeDisabled();
});

test("revalidates the link draft without replacing its saved range", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "链接", exact: true }).click();
  await page.getByLabel("链接地址").fill("javascript:alert(1)");
  await expect(page.getByRole("button", { name: "确认链接" })).toBeDisabled();
  await page.getByLabel("焦点偏移").fill("0");
  await page.getByLabel("链接地址").fill("https://example.com/retry");
  await expect(page.getByRole("button", { name: "确认链接" })).toBeEnabled();
  await page.getByRole("button", { name: "确认链接" }).click();
  await expect(page.getByLabel("已渲染文档").getByRole("link")).toHaveText("你好，cr");
});

test("queries link availability against the saved range rather than a later caret", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "链接", exact: true }).click();
  await page.getByLabel("链接地址").fill("https://example.com/saved");
  await page.getByLabel("焦点偏移").fill("0");
  await expect(page.getByRole("button", { name: "确认链接" })).toBeEnabled();
  await page.getByRole("button", { name: "确认链接" }).click();
  await expect(page.getByLabel("已渲染文档").getByRole("link")).toHaveAttribute(
    "href",
    "https://example.com/saved",
  );
});
