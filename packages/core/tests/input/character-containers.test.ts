import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  createBackspaceInputTransaction,
  createDeleteInputTransaction,
  createSelectionAfterBackspaceInput,
  createSelectionAfterDeleteInput,
  createBulletList,
  createCodeBlock,
  createDocument,
  createHeading,
  createListItem,
  createOrderedList,
  createParagraph,
  createQuote,
  createTable,
  createTaskItem,
  createTaskList,
  createText,
  getNodeAtPath,
  getPointAtTextContainerOffset,
  getTextInRange,
  isValidPoint,
  validateDocument,
  type TextNode,
} from "../../src";

function fixture(kind: string, nodes: TextNode[]) {
  let block, path;
  switch (kind) {
    case "heading":
      block = createHeading(3, nodes);
      path = [0];
      break;
    case "quote":
      block = createQuote(nodes);
      path = [0];
      break;
    case "code":
      block = createCodeBlock(nodes);
      path = [0];
      break;
    case "bullet":
      block = createBulletList([
        createListItem(nodes),
        createListItem([createText("邻项")]),
      ]);
      path = [0, 0];
      break;
    case "ordered":
      block = createOrderedList([createListItem(nodes)], 7);
      path = [0, 0];
      break;
    case "task":
      block = createTaskList([
        createTaskItem(
          nodes,
          true,
          createBulletList([createListItem([createText("子项")])]),
        ),
      ]);
      path = [0, 0];
      break;
    case "nested":
      block = createBulletList([
        createListItem(
          [createText("父项")],
          createOrderedList([createListItem(nodes)], 7),
        ),
      ]);
      path = [0, 0, 1, 0];
      break;
    case "cell": {
      block = createTable(1, 2);
      block.children[0]!.children[0]!.children = [
        createParagraph(nodes),
        createParagraph([createText("邻段")]),
      ];
      path = [0, 0, 0, 0];
      break;
    }
    default:
      block = createParagraph(nodes);
      path = [0];
  }
  return {
    document: createDocument([block, createParagraph([createText("邻块")])]),
    path,
  };
}

describe.each([
  "paragraph",
  "heading",
  "quote",
  "code",
  "bullet",
  "ordered",
  "task",
  "nested",
  "cell",
])("grapheme deletion in %s", (kind) => {
  it.each(["backward", "forward"] as const)(
    "keeps structural neighbors and metadata on %s deletion",
    (direction) => {
      const nodes = [
        createText("Ae", { bold: true }),
        createText("\u0301", { italic: true }),
        createText("B", { link: { href: "https://example.com/" } }),
      ];
      const { document, path } = fixture(kind, nodes);
      const original = structuredClone(document);
      const point =
        direction === "backward"
          ? { path: [...path, 1], offset: 1 }
          : { path: [...path, 0], offset: 1 };
      const input = { document, selection: { anchor: point, focus: point } };
      const transaction =
        direction === "backward"
          ? createBackspaceInputTransaction(input)
          : createDeleteInputTransaction(input);
      const after = applyTransaction(document, transaction);
      const selection =
        direction === "backward"
          ? createSelectionAfterBackspaceInput(input)
          : createSelectionAfterDeleteInput(input);
      expect(transaction.operations.map((operation) => operation.type)).toEqual([
        "delete_text",
      ]);
      expect(
        getTextInRange(after, {
          anchor: getPointAtTextContainerOffset(after, path, 0)!,
          focus: getPointAtTextContainerOffset(after, path, 2)!,
        }),
      ).toBe("AB");
      expect(isValidPoint(after, selection.anchor)).toBe(true);
      expect(validateDocument(after).valid).toBe(true);
      expect(getNodeAtPath(after, [1])).toEqual(getNodeAtPath(document, [1]));
      const expected = fixture(kind, [
        createText("A", kind === "code" ? undefined : { bold: true }),
        createText(
          "B",
          kind === "code" ? undefined : { link: { href: "https://example.com/" } },
        ),
      ]).document;
      expect(after).toEqual(applyTransaction(expected, { operations: [] }));
      expect(document).toEqual(original);
    },
  );
});

describe("graphemes split across model leaves", () => {
  it.each([
    "\u{1f600}",
    "\u{1f44d}\u{1f3fd}",
    "\u{1f1e8}\u{1f1f3}",
    "\u{1f469}\u200d\u{1f4bb}",
  ])("deletes %s even when a surrogate pair is split", (cluster) => {
    const nodes = [
      createText("A", { bold: true }),
      ...cluster
        .split("")
        .map((unit, index) =>
          createText(unit, index % 2 ? { italic: true } : { underline: true }),
        ),
      createText("B"),
    ];
    const { document, path } = fixture("paragraph", nodes);
    for (const direction of ["backward", "forward"] as const) {
      const point =
        direction === "backward"
          ? { path: [...path, nodes.length - 1], offset: 0 }
          : { path: [...path, 0], offset: 1 };
      const input = { document, selection: { anchor: point, focus: point } };
      const transaction =
        direction === "backward"
          ? createBackspaceInputTransaction(input)
          : createDeleteInputTransaction(input);
      const after = applyTransaction(document, transaction);
      expect(after.children[0]).toEqual(
        createParagraph([createText("A", { bold: true }), createText("B")]),
      );
    }
  });
});
