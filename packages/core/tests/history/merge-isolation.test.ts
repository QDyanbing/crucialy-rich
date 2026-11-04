import { describe, expect, it } from "vitest";
import { mergeHistoryEntries } from "../../src";
import { isolationEntry, mutateEntry } from "./isolation-fixture";

describe("explicit history merge ownership", () => {
  it.each(["previous", "next"] as const)(
    "isolates merged snapshots and operations from %s",
    (side) => {
      const previous = isolationEntry();
      const next = isolationEntry();
      next.batch = "next";
      next.after.selection!.focus.offset = 1;
      const merged = mergeHistoryEntries(previous, next);
      const expected = structuredClone(merged);
      mutateEntry(side === "previous" ? previous : next);
      expect(merged).toEqual(expected);
      expect(merged.batch).toBe("next");
      expect(merged.transaction.operations.map((operation) => operation.type)).toEqual([
        "insert_block",
        "set_link",
        "insert_block",
        "set_link",
      ]);
    },
  );

  it("does not change either operand when the merged result is edited", () => {
    const previous = isolationEntry();
    const next = isolationEntry();
    const expectedPrevious = structuredClone(previous);
    const expectedNext = structuredClone(next);
    mutateEntry(mergeHistoryEntries(previous, next));
    expect(previous).toEqual(expectedPrevious);
    expect(next).toEqual(expectedNext);
  });

  it("separates repeated operands and their operation trees", () => {
    const entry = isolationEntry();
    const merged = mergeHistoryEntries(entry, entry);
    const original = structuredClone(entry.transaction.operations);
    const operation = merged.transaction.operations[0]!;
    if (operation.type === "insert_block" && operation.block.type === "taskList") {
      const item = operation.block.children[0]!;
      if (item.type === "taskItem") item.checked = false;
      operation.path[0] = 99;
    }
    merged.before.blockSelection!.path[0] = 99;
    expect(merged.after).toEqual(entry.after);
    expect(merged.transaction.operations.slice(2)).toEqual(original);
    expect(entry.transaction.operations).toEqual(original);
  });
});
