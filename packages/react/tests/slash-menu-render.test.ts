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
      'aria-selected="true" class="crucialy-slash-menu__item" data-command="toggleQuote"',
    );
  });

  it("assigns unique DOM IDs when two editors reuse the same menu configuration", () => {
    const html = renderToStaticMarkup(
      createElement(
        "div",
        null,
        createElement(SlashMenu, { items }),
        createElement(SlashMenu, { items }),
      ),
    );
    const ids = [...html.matchAll(/ id="([^"]+)"/gu)].map((match) => match[1]);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
  });

  it("keeps arbitrary configuration IDs out of DOM ID syntax", () => {
    const html = renderToStaticMarkup(
      createElement(SlashMenu, {
        items: [{ ...items[0]!, id: "heading with spaces" }],
      }),
    );
    expect(html).not.toContain("heading with spaces");
    expect(html).toMatch(/ id="[^\s"]+"/u);
  });
});
