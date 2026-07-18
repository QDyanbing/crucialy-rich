import { describe, expect, it } from "vitest";

import {
  cloneHistoryEntry,
  createHistorySnapshot,
  createInsertTextOperation,
  createTransaction,
  type HistoryEntry,
} from "../../src";

function createEntry(): HistoryEntry {
  return {
    after: createHistorySnapshot(
      { type: "document", children: [] },
      {
        anchor: { path: [0, 0], offset: 1 },
        focus: { path: [0, 0], offset: 1 },
      },
    ),
    batch: "typing",
    before: createHistorySnapshot({ type: "document", children: [] }),
    transaction: createTransaction([
      createInsertTextOperation({ path: [0, 0], offset: 0 }, "新"),
    ]),
  };
}

describe("cloneHistoryEntry", () => {
  it("clones snapshots, transaction operations and batch marker", () => {
    const entry = createEntry();
    const cloned = cloneHistoryEntry(entry);

    entry.after.selection!.anchor.path[0] = 9;
    entry.transaction.operations[0] = createInsertTextOperation(
      { path: [9, 0], offset: 0 },
      "坏",
    );

    expect(cloned.batch).toBe("typing");
    expect(cloned.after.selection).toEqual({
      anchor: { path: [0, 0], offset: 1 },
      focus: { path: [0, 0], offset: 1 },
    });
    expect(cloned.transaction.operations[0]).toEqual({
      point: { path: [0, 0], offset: 0 },
      text: "新",
      type: "insert_text",
    });
  });
});
