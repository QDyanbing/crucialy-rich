import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { Toolbar, type ResolvedToolbarItem } from "../src";

const items: ResolvedToolbarItem[] = [
  {
    commandName: "bold",
    id: "bold",
    label: "加粗",
    state: {
      active: true,
      commandName: "bold",
      disabled: false,
      registered: true,
    },
    text: "B",
    type: "command",
  },
  { id: "separator", type: "separator" },
  {
    commandName: "missing",
    id: "missing",
    label: "缺失命令",
    state: {
      active: false,
      commandName: "missing",
      disabled: true,
      registered: false,
    },
    type: "command",
  },
];

describe("Toolbar", () => {
  it("renders accessible command and separator semantics", () => {
    const html = renderToStaticMarkup(
      createElement(Toolbar, { items, label: "格式工具栏" }),
    );

    expect(html).toContain('role="toolbar"');
    expect(html).toContain('aria-label="格式工具栏"');
    expect(html).toContain('aria-label="加粗"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('role="separator"');
    expect(html).toContain('aria-label="缺失命令"');
    expect(html).toContain("disabled");
  });
});
