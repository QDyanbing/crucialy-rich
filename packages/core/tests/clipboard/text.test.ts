import { describe, expect, it } from "vitest";
import {
  createDocument,
  createParagraph,
  createText,
  type RangeSelection,
} from "../../src";
import { getClipboardText } from "../../src/clipboard/text";

function range(start: number, end: number): RangeSelection {
  return {
    anchor: { path: [0, 0], offset: start },
    focus: { path: [0, 0], offset: end },
  };
}

describe("getClipboardText", () => {
  const document = createDocument([createParagraph([createText("前甲乙后")])]);

  it.each([
    [1, 3],
    [3, 1],
  ])("reads a range in either direction (%s, %s)", (start, end) => {
    expect(getClipboardText(document, range(start, end))).toBe("甲乙");
  });

  it("leaves the document and selection unchanged", () => {
    const selection = range(1, 3);
    const before = structuredClone({ document, selection });
    getClipboardText(document, selection);
    expect({ document, selection }).toEqual(before);
  });

  it("ignores collapsed ranges", () => {
    expect(getClipboardText(document, range(1, 1))).toBeUndefined();
  });

  it.each([-1, 5, 0.5, NaN])(
    "rejects invalid offsets %s without throwing",
    (offset) => {
      expect(getClipboardText(document, range(offset, 2))).toBeUndefined();
      expect(getClipboardText(document, range(1, offset))).toBeUndefined();
    },
  );

  it("rejects missing text paths", () => {
    expect(
      getClipboardText(document, {
        anchor: { path: [5, 0], offset: 0 },
        focus: { path: [0, 0], offset: 1 },
      }),
    ).toBeUndefined();
  });

  it("preserves whitespace and UTF-16 text without interpreting markup", () => {
    const value = createDocument([createParagraph([createText(" \t😀<b>\n ")])]);
    expect(getClipboardText(value, range(0, " \t😀<b>\n ".length))).toBe(" \t😀<b>\n ");
    expect(getClipboardText(value, range(0, 2))).toBe(" \t");
  });
});
