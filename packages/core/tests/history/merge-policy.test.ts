import { describe, expect, it } from "vitest";
import {
  canMergeHistoryEntries,
  createBlockSelection,
  createDocument,
  createHistorySnapshot,
  createParagraph,
  createText,
  createTransaction,
  type HistoryEntry,
  type HistoryMergePolicy,
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
  for (const policy of ["batch", "adjacent"] as const) {
    it.each([
      "previous-before",
      "previous-after",
      "next-before",
      "next-after",
    ] as const)(
      `does not merge across a block selection in %s (${policy})`,
      (position) => {
        const previous = entry(caret());
        const next = entry(caret());
        const target = position.startsWith("previous") ? previous : next;
        const boundary = position.endsWith("before") ? target.before : target.after;
        boundary.blockSelection = createBlockSelection([0]);
        const original = structuredClone({ previous, next });
        expect(canMergeHistoryEntries(previous, next, policy)).toBe(false);
        expect({ previous, next }).toEqual(original);
      },
    );
  }
  it.each([false, true])(
    "rejects expanded boundary selections (backward: %s)",
    (backward) => {
      const start = caret(0, 0).anchor;
      const end = caret(0, 2).anchor;
      const selection = backward
        ? { anchor: end, focus: start }
        : { anchor: start, focus: end };
      expect(
        canMergeHistoryEntries(entry(selection), entry(caret(0, 0)), "adjacent"),
      ).toBe(false);
      expect(
        canMergeHistoryEntries(entry(caret(0, 0)), entry(selection), "adjacent"),
      ).toBe(false);
    },
  );

  it.each([-1, 9, NaN])("rejects matching but invalid caret offsets %s", (offset) => {
    expect(
      canMergeHistoryEntries(
        entry(caret(0, offset)),
        entry(caret(0, offset)),
        "adjacent",
      ),
    ).toBe(false);
  });

  it("does not equate different text paths at the same visual boundary", () => {
    const snapshot = createHistorySnapshot(
      createDocument([
        createParagraph([
          createText("甲", { bold: true }),
          createText("乙", { italic: true }),
        ]),
      ]),
      caret(0, 1),
    );
    const previous = { ...entry(), after: snapshot };
    const next = {
      ...entry(),
      before: createHistorySnapshot(snapshot.document, {
        anchor: { path: [0, 1], offset: 0 },
        focus: { path: [0, 1], offset: 0 },
      }),
    };
    expect(canMergeHistoryEntries(previous, next, "adjacent")).toBe(false);
  });

  it("rejects invalid policies and does not mutate history entries", () => {
    const previous = entry(caret());
    const next = entry(caret());
    const before = structuredClone({ previous, next });
    expect(
      canMergeHistoryEntries(previous, next, "invalid" as HistoryMergePolicy),
    ).toBe(false);
    canMergeHistoryEntries(previous, next, "adjacent");
    expect({ previous, next }).toEqual(before);
  });

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
