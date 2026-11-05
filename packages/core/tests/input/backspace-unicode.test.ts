import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  createBackspaceInputTransaction,
  createDocument,
  createParagraph,
  createSelectionAfterBackspaceInput,
  createText,
  isValidPoint,
} from "../../src";

describe("grapheme-aware Backspace", () => {
  it.each([
    "\u{1f600}",
    "e\u0301",
    "\u{1f44d}\u{1f3fd}",
    "\u{1f1e8}\u{1f1f3}",
    "\u{1f469}\u200d\u{1f4bb}",
    "1\ufe0f\u20e3",
    "\u1100\u1161\u11a8",
  ])("deletes the whole preceding cluster: %s", (cluster) => {
    const document = createDocument([createParagraph([createText(`A${cluster}B`)])]);
    const original = structuredClone(document);
    const point = { path: [0, 0], offset: 1 + cluster.length };
    const input = { document, selection: { anchor: point, focus: point } };
    const transaction = createBackspaceInputTransaction(input);
    const after = applyTransaction(document, transaction);
    const selection = createSelectionAfterBackspaceInput(input);
    expect(after).toEqual(createDocument([createParagraph([createText("AB")])]));
    expect(transaction.operations).toHaveLength(1);
    expect(selection.anchor).toEqual({ path: [0, 0], offset: 1 });
    expect(isValidPoint(after, selection.anchor)).toBe(true);
    expect(document).toEqual(original);
  });

  it("expands a UTF-16 caret inside an emoji to remove its whole cluster", () => {
    const document = createDocument([createParagraph([createText("A\u{1f600}B")])]);
    const point = { path: [0, 0], offset: 2 };
    const input = { document, selection: { anchor: point, focus: point } };
    expect(applyTransaction(document, createBackspaceInputTransaction(input))).toEqual(
      createDocument([createParagraph([createText("AB")])]),
    );
    expect(createSelectionAfterBackspaceInput(input).anchor.offset).toBe(1);
  });
});
