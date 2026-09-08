import { createDocument, createParagraph, createText } from "@crucialy-rich/core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FixedToolbar } from "../src";

const document = createDocument([
  createParagraph([createText("加粗文本", { bold: true })]),
]);

describe("FixedToolbar", () => {
  it("renders command state from the current selection", () => {
    const html = renderToStaticMarkup(
      createElement(FixedToolbar, {
        document,
        selection: {
          anchor: { offset: 0, path: [0, 0] },
          focus: { offset: 4, path: [0, 0] },
        },
      }),
    );

    expect(html).toContain('aria-label="固定格式工具栏"');
    expect(html).toContain(
      'aria-label="加粗" aria-pressed="true" class="crucialy-toolbar__button"',
    );
  });

  it("disables selection commands when selection is missing", () => {
    const html = renderToStaticMarkup(createElement(FixedToolbar, { document }));

    expect(html).toContain('aria-label="加粗"');
    expect(html).toContain("disabled");
  });
});
