import { describe, expect, it } from "vitest";

import { filterSlashCommandItems } from "../src/slash-menu/filter";
import type { SlashCommandItem } from "../src/slash-menu/types";

const items: SlashCommandItem[] = [
  {
    commandName: "setHeading",
    id: "heading-1",
    keywords: ["标题", "H1"],
    label: "一级标题",
  },
  {
    commandName: "toggleQuote",
    id: "quote",
    keywords: ["引用", "blockquote"],
    label: "引用块",
  },
  {
    commandName: "insertDivider",
    id: "divider",
    keywords: ["分割线", "horizontal-rule"],
    label: "分割线",
  },
];

describe("filterSlashCommandItems", () => {
  it("returns a new list in configuration order for an empty query", () => {
    const result = filterSlashCommandItems(items, "  ");

    expect(result).toEqual(items);
    expect(result).not.toBe(items);
  });

  it.each([
    ["hea", ["heading-1"]],
    ["H1", ["heading-1"]],
    ["标", ["heading-1"]],
    ["BLOCK", ["quote"]],
    ["分割", ["divider"]],
  ])("matches the query %s by item metadata", (query, expectedIds) => {
    expect(filterSlashCommandItems(items, query).map((item) => item.id)).toEqual(
      expectedIds,
    );
  });

  it("does not use a middle-of-term match", () => {
    expect(filterSlashCommandItems(items, "vider")).toEqual([]);
  });

  it("does not mutate the source configuration", () => {
    const snapshot = structuredClone(items);

    filterSlashCommandItems(items, "quote");

    expect(items).toEqual(snapshot);
  });
});
