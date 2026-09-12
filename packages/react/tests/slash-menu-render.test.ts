import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SlashMenu } from "../src/slash-menu/SlashMenu";

const items = [
  {
    commandName: "setHeading",
    description: "切换为一级标题",
    id: "heading-1",
    label: "一级标题",
    payload: { level: 1 },
  },
  {
    commandName: "toggleQuote",
    id: "quote",
    label: "引用",
  },
];

describe("SlashMenu", () => {
  it("renders accessible options from configuration", () => {
    const html = renderToStaticMarkup(
      createElement(SlashMenu, { items, label: "插入块" }),
    );

    expect(html).toContain('role="listbox"');
    expect(html).toContain('aria-label="插入块"');
    expect(html).toContain('role="option"');
    expect(html).toContain('data-command="setHeading"');
    expect(html).toContain("切换为一级标题");
    expect(html).toContain("引用");
  });

  it("marks only the active option as selected", () => {
    const html = renderToStaticMarkup(
      createElement(SlashMenu, { activeIndex: 1, items }),
    );

    expect(html.match(/aria-selected="true"/gu)).toHaveLength(1);
    expect(html).toContain(
      'aria-selected="true" class="crucialy-slash-menu__item" data-command="toggleQuote" id="crucialy-slash-menu-quote"',
    );
  });
});
