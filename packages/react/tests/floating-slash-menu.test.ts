import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FloatingSlashMenu } from "../src/slash-menu/FloatingSlashMenu";

const items = [{ commandName: "setHeading", id: "heading-1", label: "一级标题" }];

describe("FloatingSlashMenu", () => {
  it("does not render without an anchor or matching items", () => {
    expect(renderToStaticMarkup(createElement(FloatingSlashMenu, { items }))).toBe("");
    expect(
      renderToStaticMarkup(
        createElement(FloatingSlashMenu, {
          anchorRect: { bottom: 120, left: 80, top: 100 },
          items: [],
        }),
      ),
    ).toBe("");
  });

  it("positions matching items near the caret", () => {
    const html = renderToStaticMarkup(
      createElement(FloatingSlashMenu, {
        anchorRect: { bottom: 120, left: 80, top: 100 },
        items,
        menuSize: { height: 200, width: 240 },
        viewport: { height: 600, width: 800 },
      }),
    );

    expect(html).toContain('class="crucialy-floating-slash-menu"');
    expect(html).toContain('data-placement="below"');
    expect(html).toContain("left:80px");
    expect(html).toContain("top:126px");
    expect(html).toContain("一级标题");
  });

  it("fits oversized menus inside a narrow viewport", () => {
    const html = renderToStaticMarkup(
      createElement(FloatingSlashMenu, {
        anchorRect: { bottom: 100, left: 300, top: 82 },
        items,
        viewport: { height: 240, width: 320 },
      }),
    );

    expect(html).toContain("max-height:224px");
    expect(html).toContain("width:280px");
    expect(html).toContain("left:32px");
  });
});
