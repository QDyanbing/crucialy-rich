import { describe, expect, it } from "vitest";
import {
  canMergeHistoryEntries,
  createDocument,
  createHistorySnapshot,
  createParagraph,
  createText,
  createTransaction,
  type HistoryEntry,
  type RangeSelection,
} from "../../src";

const document = createDocument([
  createParagraph([createText("第一段")]),
  createParagraph([createText("第二段")]),
]);
function caret(block = 0, offset = 1): RangeSelection {
  return { anchor: { path: [block, 0], offset }, focus: { path: [block, 0], offset } };
}
function entry(selection?: RangeSelection): HistoryEntry {
  const snapshot = createHistorySnapshot(document, selection);
  return {
    before: snapshot,
    after: snapshot,
    batch: "typing",
    transaction: createTransaction(),
  };
}

describe("History adjacent merge policy", () => {
  it("keeps the existing batch-only default across caret jumps", () => {
    expect(canMergeHistoryEntries(entry(caret()), entry(caret(1)))).toBe(true);
    expect(canMergeHistoryEntries(entry(), entry(), "batch")).toBe(true);
  });

  it("accepts the same valid collapsed point under adjacent policy", () => {
    expect(canMergeHistoryEntries(entry(caret()), entry(caret()), "adjacent")).toBe(
      true,
    );
  });

  it.each([caret(1), caret(0, 2)])("rejects a caret jump to %j", (selection) => {
    expect(canMergeHistoryEntries(entry(caret()), entry(selection), "adjacent")).toBe(
      false,
    );
  });

  it("still requires matching nonempty batch markers", () => {
    const previous = entry(caret());
    const next = entry(caret());
    next.batch = "paste";
    expect(canMergeHistoryEntries(previous, next, "adjacent")).toBe(false);
    previous.batch = "";
    next.batch = "";
    expect(canMergeHistoryEntries(previous, next, "adjacent")).toBe(false);
    expect(canMergeHistoryEntries(undefined, next, "adjacent")).toBe(false);
  });

  it("rejects missing selections instead of guessing continuity", () => {
    expect(canMergeHistoryEntries(entry(), entry(caret()), "adjacent")).toBe(false);
    expect(canMergeHistoryEntries(entry(caret()), entry(), "adjacent")).toBe(false);
  });
});
