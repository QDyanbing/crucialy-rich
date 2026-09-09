import { describe, expect, it } from "vitest";

import { defineSlashCommandItems } from "../src/slash-menu/config";

describe("defineSlashCommandItems", () => {
  it("normalizes and copies a valid configuration", () => {
    const source = [
      {
        commandName: "setHeading",
        description: " 一级标题 ",
        id: " heading-1 ",
        keywords: [" 标题 ", " h1 "],
        label: " 标题一 ",
        payload: { level: 1 },
      },
    ];
    const items = defineSlashCommandItems(source);

    expect(items).toEqual([
      {
        commandName: "setHeading",
        description: "一级标题",
        id: "heading-1",
        keywords: ["标题", "h1"],
        label: "标题一",
        payload: { level: 1 },
      },
    ]);
    expect(items).not.toBe(source);
    expect(items[0]).not.toBe(source[0]);
    expect(items[0]?.keywords).not.toBe(source[0]?.keywords);
  });

  it("rejects duplicate normalized ids", () => {
    expect(() =>
      defineSlashCommandItems([
        { commandName: "setHeading", id: "heading", label: "标题" },
        { commandName: "toggleQuote", id: " heading ", label: "引用" },
      ]),
    ).toThrow("Slash command id must be unique: heading");
  });

  it.each([
    { commandName: "bold", id: " ", label: "加粗" },
    { commandName: " ", id: "bold", label: "加粗" },
    { commandName: "bold", id: "bold", label: " " },
    { commandName: "bold", id: "bold", keywords: [""], label: "加粗" },
    { commandName: "bold", description: " ", id: "bold", label: "加粗" },
  ])("rejects blank fields", (items) => {
    expect(() => defineSlashCommandItems([items])).toThrow("must not be empty");
  });
});
