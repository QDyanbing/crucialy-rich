import { createDocument, createParagraph, createText } from "@crucialy-rich/core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FloatingToolbar } from "../src";

const document = createDocument([createParagraph([createText("悬浮工具栏")])]);
const anchorRect = { bottom: 240, height: 20, left: 300, top: 220, width: 100 };

describe("FloatingToolbar", () => {
  it("hides for a collapsed selection", () => {
    const html = renderToStaticMarkup(
      createElement(FloatingToolbar, {
        anchorRect,
        document,
        selection: {
          anchor: { offset: 1, path: [0, 0] },
          focus: { offset: 1, path: [0, 0] },
        },
      }),
    );

    expect(html).toBe("");
  });

  it("positions a toolbar for a non-collapsed selection", () => {
    const html = renderToStaticMarkup(
      createElement(FloatingToolbar, {
        anchorRect,
        document,
        label: "悬浮格式工具栏",
        selection: {
          anchor: { offset: 0, path: [0, 0] },
          focus: { offset: 4, path: [0, 0] },
        },
        toolbarSize: { height: 40, width: 200 },
        viewport: { height: 600, width: 800 },
      }),
    );

    expect(html).toContain('class="crucialy-floating-toolbar"');
    expect(html).toContain("left:250px");
    expect(html).toContain("top:172px");
    expect(html).toContain('aria-label="悬浮格式工具栏"');
  });

  it("fits the default width inside a narrow viewport", () => {
    const html = renderToStaticMarkup(
      createElement(FloatingToolbar, {
        anchorRect,
        document,
        selection: {
          anchor: { offset: 0, path: [0, 0] },
          focus: { offset: 4, path: [0, 0] },
        },
        viewport: { height: 600, width: 320 },
      }),
    );

    expect(html).toContain("left:8px");
    expect(html).toContain("width:304px");
  });
});
