import { describe, expect, it } from "vitest";
import { createDocument, createParagraph, createText, getTextInRange } from "../../src";
import { createCharacterDeletionRange } from "../../src/input/character-range";

const clusters = [
  "\u{1f600}",
  "e\u0301",
  "\u{1f44d}\u{1f3fd}",
  "\u{1f1e8}\u{1f1f3}",
  "\u{1f469}\u200d\u{1f4bb}",
  "1\ufe0f\u20e3",
  "\r\n",
];

describe("character deletion ranges", () => {
  it.each(clusters)("selects a whole grapheme in either direction: %s", (cluster) => {
    const document = createDocument([createParagraph([createText(`A${cluster}B`)])]);
    for (const direction of ["backward", "forward"] as const) {
      const range = createCharacterDeletionRange(
        document,
        {
          path: [0, 0],
          offset: direction === "backward" ? 1 + cluster.length : 1,
        },
        direction,
      )!;
      expect(getTextInRange(document, range)).toBe(cluster);
      expect(range.anchor.offset).toBe(1);
      expect(range.focus.offset).toBe(1 + cluster.length);
    }
  });

  it("expands a caret inside a cluster without splitting it", () => {
    const document = createDocument([createParagraph([createText("A\u{1f600}B")])]);
    for (const direction of ["backward", "forward"] as const) {
      const range = createCharacterDeletionRange(
        document,
        { path: [0, 0], offset: 2 },
        direction,
      )!;
      expect(getTextInRange(document, range)).toBe("\u{1f600}");
    }
  });

  it("does not select beyond the text container", () => {
    const document = createDocument([
      createParagraph([createText("A")]),
      createParagraph([createText("B")]),
    ]);
    expect(
      createCharacterDeletionRange(document, { path: [0, 0], offset: 0 }, "backward"),
    ).toBeUndefined();
    expect(
      createCharacterDeletionRange(document, { path: [0, 0], offset: 1 }, "forward"),
    ).toBeUndefined();
  });
});
