import { describe, expect, it } from "vitest";

import {
  canMergeHistoryEntries,
  createDocument,
  createHistorySnapshot,
  createInsertTextOperation,
  createParagraph,
  createText,
  createTransaction,
  mergeHistoryEntries,
  type HistoryEntry,
} from "../../src";

function createSnapshot(text: string) {
  return createHistorySnapshot(createDocument([createParagraph([createText(text)])]), {
    anchor: { path: [0, 0], offset: text.length },
    focus: { path: [0, 0], offset: text.length },
  });
}

function createEntry(before: string, after: string, batch?: string): HistoryEntry {
  const entry: HistoryEntry = {
    after: createSnapshot(after),
    before: createSnapshot(before),
    transaction: createTransaction([
      createInsertTextOperation({ path: [0, 0], offset: before.length }, after),
    ]),
  };

  return batch ? { ...entry, batch } : entry;
}

describe("history merge helpers", () => {
  it("merges entries only when both entries share a non-empty batch", () => {
    const previous = createEntry("", "你", "typing");

    expect(canMergeHistoryEntries(previous, createEntry("你", "你好", "typing"))).toBe(
      true,
    );
    expect(canMergeHistoryEntries(previous, createEntry("你", "你好", "delete"))).toBe(
      false,
    );
    expect(canMergeHistoryEntries(previous, createEntry("你", "你好"))).toBe(false);
    expect(canMergeHistoryEntries(undefined, createEntry("你", "你好", "typing"))).toBe(
      false,
    );
  });

  it("keeps the first before snapshot and latest after snapshot", () => {
    const previous = createEntry("", "你", "typing");
    const next = createEntry("你", "你好", "typing");

    const merged = mergeHistoryEntries(previous, next);

    previous.before.document.children[0]!.children[0]!.text = "污染";
    next.after.document.children[0]!.children[0]!.text = "污染";

    expect(merged.batch).toBe("typing");
    expect(merged.before).toEqual(createSnapshot(""));
    expect(merged.after).toEqual(createSnapshot("你好"));
    expect(merged.transaction.operations).toHaveLength(2);
  });
});
