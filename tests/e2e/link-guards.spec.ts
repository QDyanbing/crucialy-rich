import { expect, test } from "@playwright/test";
import { characterDocument, setCharacterCaret } from "./character-helpers";
import { compose } from "./composition-helpers";

test("locks link controls during composition and recovers the captured range", async ({
  page,
}) => {
  await page.goto("/");
  const opener = page.getByRole("button", { name: "链接", exact: true });
  await compose(page, "compositionstart");
  await expect(opener).toBeDisabled();
  await opener.evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByRole("dialog", { name: "链接设置" })).toHaveCount(0);
  await compose(page, "compositionend");
  await opener.click();
  const before = await characterDocument(page);
  await setCharacterCaret(page, [0, 0], 0);
  await compose(page, "compositionstart");
  const confirm = page.getByRole("button", { name: "确认链接" });
  await expect(confirm).toBeDisabled();
  await expect(page.getByRole("button", { name: "取消链接" })).toBeDisabled();
  await confirm.evaluate((button: HTMLButtonElement) => button.click());
  await expect.poll(() => characterDocument(page)).toEqual(before);
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 0');
  await compose(page, "compositionend");
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(page.getByLabel("已渲染文档").getByRole("link")).toHaveText("你好，cr");
  await expect(page.getByLabel("History 状态")).toContainText('"undoStack": 1');
});

test("honors a canceled link opener and does not retain its pointer range", async ({
  page,
}) => {
  await page.goto("/");
  const opener = page.getByRole("button", { name: "链接", exact: true });
  await opener.evaluate((button) =>
    button.addEventListener("click", (event) => event.preventDefault(), { once: true }),
  );
  await opener.click();
  await expect(page.getByRole("dialog", { name: "链接设置" })).toHaveCount(0);
  await page.getByLabel("锚点偏移").fill("2");
  await page.getByLabel("焦点偏移").fill("4");
  await opener.evaluate((button: HTMLButtonElement) => button.click());
  await page.getByRole("button", { name: "确认链接" }).click();
  await expect(page.getByLabel("已渲染文档").getByRole("link")).toHaveText("，c");
});

for (const gesture of ["cancel", "secondary", "non-primary"] as const) {
  test(`does not reuse a ${gesture} link pointer snapshot`, async ({ page }) => {
    await page.goto("/");
    const opener = page.getByRole("button", { name: "链接", exact: true });
    await opener.dispatchEvent("pointerdown", {
      button: gesture === "secondary" ? 2 : 0,
      isPrimary: gesture !== "non-primary",
    });
    if (gesture === "cancel") await opener.dispatchEvent("pointercancel");
    await page.getByLabel("锚点偏移").fill("2");
    await page.getByLabel("焦点偏移").fill("4");
    await opener.evaluate((button: HTMLButtonElement) => button.click());
    await page.getByRole("button", { name: "确认链接" }).click();
    await expect(page.getByLabel("已渲染文档").getByRole("link")).toHaveText("，c");
  });
}

test("honors canceled link confirmation and accepts the next activation", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "链接", exact: true }).click();
  const confirm = page.getByRole("button", { name: "确认链接" });
  const before = await characterDocument(page);
  await confirm.evaluate((button) =>
    button.addEventListener("click", (event) => event.preventDefault(), { once: true }),
  );
  await confirm.click();
  await expect.poll(() => characterDocument(page)).toEqual(before);
  await expect(page.getByRole("dialog", { name: "链接设置" })).toBeVisible();
  await confirm.click();
  await expect(page.getByLabel("已渲染文档").getByRole("link")).toHaveCount(1);
});
