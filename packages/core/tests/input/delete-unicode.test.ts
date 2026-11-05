import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  createDeleteInputTransaction,
  createDocument,
  createParagraph,
  createSelectionAfterDeleteInput,
  createText,
  isValidPoint,
} from "../../src";

describe("grapheme-aware Delete", () => {
  it.each([
    "\u{1f600}",
    "e\u0301",
    "\u{1f44d}\u{1f3fd}",
    "\u{1f1e8}\u{1f1f3}",
    "\u{1f469}\u200d\u{1f4bb}",
    "1\ufe0f\u20e3",
    "\u1100\u1161\u11a8",
  ])("deletes the whole following cluster: %s", (cluster) => {
    const document = createDocument([createParagraph([createText(`A${cluster}B`)])]);
    const original = structuredClone(document);
    const point = { path: [0, 0], offset: 1 };
    const input = { document, selection: { anchor: point, focus: point } };
    const transaction = createDeleteInputTransaction(input);
    const after = applyTransaction(document, transaction);
    const selection = createSelectionAfterDeleteInput(input);
    expect(after).toEqual(createDocument([createParagraph([createText("AB")])]));
    expect(transaction.operations).toHaveLength(1);
    expect(selection.anchor).toEqual(point);
    expect(isValidPoint(after, selection.anchor)).toBe(true);
    expect(document).toEqual(original);
  });

  it("moves an interior UTF-16 caret to the removed grapheme start", () => {
    const document = createDocument([createParagraph([createText("A\u{1f600}B")])]);
    const point = { path: [0, 0], offset: 2 };
    const input = { document, selection: { anchor: point, focus: point } };
    expect(applyTransaction(document, createDeleteInputTransaction(input))).toEqual(
      createDocument([createParagraph([createText("AB")])]),
    );
    expect(createSelectionAfterDeleteInput(input).anchor.offset).toBe(1);
  });
});
