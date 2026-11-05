import { type Page } from "@playwright/test";

export async function setCharacterCaret(page: Page, path: number[], offset: number) {
  await page.getByLabel("已渲染文档").evaluate(
    (root, point) => {
      (root as HTMLElement).focus();
      const node = root.querySelector(
        `[data-crucialy-path="${JSON.stringify(point.path)}"]`,
      )!.firstChild!;
      window.getSelection()!.setBaseAndExtent(node, point.offset, node, point.offset);
    },
    { path, offset },
  );
}

export async function characterDocument(page: Page) {
  return JSON.parse(
    (await page.getByLabel("文档 JSON", { exact: true }).textContent())!,
  );
}
