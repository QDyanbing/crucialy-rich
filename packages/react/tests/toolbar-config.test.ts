import { describe, expect, it } from "vitest";

import { defineToolbarItems, type ToolbarItem } from "../src";

describe("defineToolbarItems", () => {
  it("copies a valid toolbar configuration", () => {
    const source: ToolbarItem[] = [
      {
        commandName: "bold",
        id: "bold",
        label: "加粗",
        text: "B",
        type: "command",
      },
      { id: "format-separator", type: "separator" },
    ];
    const items = defineToolbarItems(source);

    expect(items).toEqual(source);
    expect(items).not.toBe(source);
    expect(items[0]).not.toBe(source[0]);
  });

  it("rejects duplicate ids", () => {
    expect(() =>
      defineToolbarItems([
        { commandName: "bold", id: "format", label: "加粗", type: "command" },
        { commandName: "italic", id: "format", label: "斜体", type: "command" },
      ]),
    ).toThrow("Toolbar item id must be unique");
  });

  it("rejects empty command fields", () => {
    expect(() =>
      defineToolbarItems([
        { commandName: "", id: "empty", label: "", type: "command" },
      ]),
    ).toThrow("Toolbar command name and label must not be empty");
  });
});
