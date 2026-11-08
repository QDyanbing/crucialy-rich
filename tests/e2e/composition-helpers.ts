import { type Page } from "@playwright/test";

export async function compose(
  page: Page,
  type: "compositionstart" | "compositionupdate" | "compositionend",
  data = "",
) {
  await page.getByLabel("已渲染文档").evaluate(
    (root, input) => {
      root.dispatchEvent(
        new CompositionEvent(input.type, {
          bubbles: true,
          cancelable: true,
          data: input.data,
        }),
      );
    },
    { type, data },
  );
}
