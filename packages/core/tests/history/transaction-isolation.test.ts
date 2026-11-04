import { describe, expect, it } from "vitest";
import {
  cloneHistoryEntry,
  createHistoryEntry,
  createHistoryState,
  createParagraph,
  createText,
  type Operation,
  type OperationType,
} from "../../src";
import { isolationEntry } from "./isolation-fixture";

function operations() {
  const point = { path: [0, 0], offset: 0 };
  const range = { anchor: point, focus: { path: [0, 0], offset: 1 } };
  const path = [0];
  return {
    clear_marks: { type: "clear_marks", range },
    delete_range: { type: "delete_range", range },
    delete_text: { type: "delete_text", range },
    exit_list_item: { type: "exit_list_item", point },
    indent_list_item: { type: "indent_list_item", point },
    insert_block: {
      type: "insert_block",
      path,
      block: createParagraph([
        createText("原文", { link: { href: "https://example.com/" } }),
      ]),
    },
    insert_text: { type: "insert_text", point, text: "新" },
    merge_block: { type: "merge_block", point },
    outdent_list_item: { type: "outdent_list_item", point },
    remove_block: { type: "remove_block", path },
    set_block_type: {
      type: "set_block_type",
      path,
      block: { type: "heading", level: 2 },
    },
    set_link: { type: "set_link", range, link: { href: "https://example.com/" } },
    set_mark_attribute: {
      type: "set_mark_attribute",
      range,
      attribute: "fontSize",
      value: 18,
    },
    set_table_cell_text: { type: "set_table_cell_text", path, text: "格" },
    set_task_item_checked: { type: "set_task_item_checked", path, checked: true },
    split_block: { type: "split_block", point },
    split_list_item: { type: "split_list_item", point },
    toggle_mark: { type: "toggle_mark", range, mark: "bold", active: true },
    unwrap_list_item: { type: "unwrap_list_item", point },
  } satisfies Record<OperationType, Operation>;
}

function mutate(operation: Operation) {
  if ("point" in operation) {
    operation.point.path[0] = 99;
    operation.point.offset = 99;
  }
  if ("range" in operation) {
    operation.range.anchor.path[0] = 99;
    operation.range.focus.offset = 99;
  }
  if ("path" in operation) operation.path[0] = 99;
  if (operation.type === "set_link") operation.link!.href = "https://changed.test/";
  if (operation.type === "set_block_type" && operation.block.type === "heading")
    operation.block.level = 6;
  if (operation.type === "insert_block" && operation.block.type === "paragraph") {
    operation.block.children[0]!.text = "污染";
    operation.block.children[0]!.marks!.link!.href = "https://changed.test/";
  }
}

describe("history transaction ownership", () => {
  it.each(Object.keys(operations()) as OperationType[])(
    "copies mutable data in %s when creating and cloning entries",
    (type) => {
      const operation = operations()[type];
      const input = {
        ...isolationEntry(),
        history: createHistoryState(),
        transaction: { operations: [operation] },
      };
      const entry = createHistoryEntry(input);
      const cloned = cloneHistoryEntry(entry);
      const expected = structuredClone(entry);
      mutate(operation);
      input.transaction.operations.length = 0;
      expect(entry).toEqual(expected);
      mutate(entry.transaction.operations[0]!);
      entry.transaction.operations.length = 0;
      expect(cloned).toEqual(expected);
    },
  );
});
