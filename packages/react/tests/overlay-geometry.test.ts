import { createDocument, createParagraph, createText } from "@crucialy-rich/core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  FloatingSlashMenu,
  FloatingToolbar,
  type FloatingSlashMenuProps,
  type FloatingToolbarProps,
} from "../src";

const anchor = { top: 80, bottom: 100, left: 20, width: 50, height: 20 };
const viewport = { width: 320, height: 240 },
  size = { width: 200, height: 40 };
const items = [{ id: "one", commandName: "one", label: "选项" }];
const value = createDocument([createParagraph([createText("正文")])]);
const selection = {
  anchor: { path: [0, 0], offset: 0 },
  focus: { path: [0, 0], offset: 1 },
};

describe("floating component geometry validation", () => {
  it.each([
    { anchorRect: { ...anchor, left: Number.NaN } },
    { anchorRect: { ...anchor, top: Number.NEGATIVE_INFINITY } },
    { anchorRect: { ...anchor, bottom: Number.POSITIVE_INFINITY } },
    { anchorRect: { ...anchor, bottom: 70 } },
    { menuSize: { ...size, width: 0 } },
    { menuSize: { ...size, height: -1 } },
    { menuSize: { ...size, height: Number.NaN } },
    { viewport: { ...viewport, width: 16 } },
    { viewport: { ...viewport, height: 0 } },
    { viewport: { ...viewport, width: Number.NaN } },
  ] satisfies Partial<FloatingSlashMenuProps>[])(
    "hides an invalid Slash geometry %j",
    (props) => {
      expect(
        renderToStaticMarkup(
          createElement(FloatingSlashMenu, {
            items,
            anchorRect: anchor,
            viewport,
            ...props,
          }),
        ),
      ).toBe("");
    },
  );

  it.each([
    { anchorRect: { ...anchor, left: Number.NaN } },
    { anchorRect: { ...anchor, top: Number.NEGATIVE_INFINITY } },
    { anchorRect: { ...anchor, bottom: Number.POSITIVE_INFINITY } },
    { anchorRect: { ...anchor, bottom: 70 } },
    { anchorRect: { ...anchor, width: -1 } },
    { anchorRect: { ...anchor, height: -1 } },
    { anchorRect: { ...anchor, height: Number.NaN } },
    { toolbarSize: { ...size, width: 0 } },
    { toolbarSize: { ...size, height: -1 } },
    { toolbarSize: { ...size, height: Number.NaN } },
    { toolbarSize: { ...size, height: 230 } },
    { viewport: { ...viewport, width: 16 } },
    { viewport: { ...viewport, height: 0 } },
    { viewport: { ...viewport, width: Number.NaN } },
  ] satisfies Partial<FloatingToolbarProps>[])(
    "hides an invalid Toolbar geometry %j",
    (props) => {
      expect(
        renderToStaticMarkup(
          createElement(FloatingToolbar, {
            document: value,
            selection,
            anchorRect: anchor,
            viewport,
            ...props,
          }),
        ),
      ).toBe("");
    },
  );

  it("continues fitting a scrollable Slash menu into available height", () => {
    const html = renderToStaticMarkup(
      createElement(FloatingSlashMenu, {
        items,
        anchorRect: anchor,
        viewport,
        menuSize: { width: 500, height: 500 },
      }),
    );
    expect(html).toContain("width:304px");
    expect(html).toContain("max-height:224px");
    expect(html).toContain("overflow-y:auto");
  });
});
