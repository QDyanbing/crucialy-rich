import {
  INSERT_DIVIDER_COMMAND_NAME,
  SET_CODE_BLOCK_COMMAND_NAME,
  SET_HEADING_COMMAND_NAME,
  TOGGLE_BULLET_LIST_COMMAND_NAME,
  TOGGLE_ORDERED_LIST_COMMAND_NAME,
  TOGGLE_QUOTE_COMMAND_NAME,
  TOGGLE_TASK_LIST_COMMAND_NAME,
} from "@crucialy-rich/core";
import { describe, expect, it } from "vitest";

import { createDefaultSlashCommandItems } from "../src/slash-menu/defaults";
import { filterSlashCommandItems } from "../src/slash-menu/filter";

describe("createDefaultSlashCommandItems", () => {
  it("provides the planned block command order", () => {
    expect(
      createDefaultSlashCommandItems().map((item) => [item.id, item.commandName]),
    ).toEqual([
      ["paragraph", SET_HEADING_COMMAND_NAME],
      ["heading-1", SET_HEADING_COMMAND_NAME],
      ["heading-2", SET_HEADING_COMMAND_NAME],
      ["heading-3", SET_HEADING_COMMAND_NAME],
      ["quote", TOGGLE_QUOTE_COMMAND_NAME],
      ["code-block", SET_CODE_BLOCK_COMMAND_NAME],
      ["bullet-list", TOGGLE_BULLET_LIST_COMMAND_NAME],
      ["ordered-list", TOGGLE_ORDERED_LIST_COMMAND_NAME],
      ["task-list", TOGGLE_TASK_LIST_COMMAND_NAME],
      ["divider", INSERT_DIVIDER_COMMAND_NAME],
    ]);
  });

  it("provides the payloads required by block type commands", () => {
    const items = createDefaultSlashCommandItems();

    expect(items.find((item) => item.id === "paragraph")?.payload).toEqual({
      level: null,
    });
    expect(items.find((item) => item.id === "heading-3")?.payload).toEqual({
      level: 3,
    });
    expect(items.find((item) => item.id === "code-block")?.payload).toEqual({
      enabled: true,
    });
  });

  it.each([
    ["标题", ["heading-1", "heading-2", "heading-3"]],
    ["代码", ["code-block"]],
    ["待办", ["task-list"]],
    ["hr", ["divider"]],
  ])("can be filtered with the alias %s", (query, expectedIds) => {
    expect(
      filterSlashCommandItems(createDefaultSlashCommandItems(), query).map(
        (item) => item.id,
      ),
    ).toEqual(expectedIds);
  });
});
