import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  createBackspaceInputTransaction,
  createDeleteInputTransaction,
  createDocument,
  createDivider,
  createParagraph,
  createText,
  deleteSelectionCommand,
} from "../../src";

describe.each([
  ["Backspace", createBackspaceInputTransaction],
  ["Delete", createDeleteInputTransaction],
] as const)("%s character input boundaries", (_key, create) => {
  it.each([
    { path: [1, 0], offset: -1 },
    { path: [1, 0], offset: 0.5 },
    { path: [1, 0], offset: NaN },
    { path: [1, 0], offset: Infinity },
    { path: [1, 0], offset: 2 },
    { path: [1], offset: 0 },
    { path: [9, 0], offset: 0 },
    { path: [1, -1], offset: 0 },
    { path: [1, 0, 0], offset: 0 },
  ])(
    "refuses invalid caret $path / $offset before any structural operation",
    (point) => {
      const document = createDocument([
        createParagraph([createText("前")]),
        createParagraph([createText("x")]),
        createDivider(),
      ]);
      expect(
        create({ document, selection: { anchor: point, focus: point } }).operations,
      ).toEqual([]);
    },
  );

  it("leaves non-collapsed ranges to the range command", () => {
    const document = createDocument([createParagraph([createText("Ae\u0301B")])]);
    const selection = {
      anchor: { path: [0, 0], offset: 1 },
      focus: { path: [0, 0], offset: 2 },
    };
    expect(create({ document, selection }).operations).toEqual([]);
    const result = deleteSelectionCommand.execute({ context: { document, selection } });
    expect(result.ok).toBe(true);
    expect(applyTransaction(document, result.transaction!)).toEqual(
      createDocument([createParagraph([createText("A\u0301B")])]),
    );
  });
});

describe("empty model leaves between visible characters", () => {
  it("skips empty formatting placeholders without merging blocks", () => {
    const document = createDocument([
      createParagraph([
        createText("A", { bold: true }),
        createText("", { italic: true }),
        createText("e"),
        createText("\u0301", { underline: true }),
        createText("", { link: { href: "https://example.com/" } }),
        createText("B"),
      ]),
      createParagraph([createText("保留")]),
    ]);
    for (const [create, point] of [
      [createDeleteInputTransaction, { path: [0, 1], offset: 0 }],
      [createBackspaceInputTransaction, { path: [0, 4], offset: 0 }],
    ] as const) {
      const transaction = create({
        document,
        selection: { anchor: point, focus: point },
      });
      const after = applyTransaction(document, transaction);
      expect(transaction.operations.map((operation) => operation.type)).toEqual([
        "delete_text",
      ]);
      expect(after.children[0]!.children.map((node) => node.text).join("")).toBe("AB");
      expect(after.children).toHaveLength(2);
    }
  });
});
