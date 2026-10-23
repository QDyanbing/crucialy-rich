import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  createBulletList,
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createListItem,
  createParagraph,
  createTable,
  createText,
  deleteSelectionCommand,
  getClipboardText,
  recordHistory,
  redoHistory,
  undoHistory,
  validateDocument,
  type DocumentNode,
  type RangeSelection,
} from "../../src";

function fixture(kind: string): {
  document: DocumentNode;
  selection: RangeSelection;
  text: string;
} {
  const paragraphs = [
    createParagraph([createText("开头", { bold: true })]),
    createParagraph([createText("结尾", { italic: true })]),
  ];
  if (kind === "cell") {
    const table = createTable(1, 2);
    table.children[0]!.children[0]!.children = paragraphs;
    return {
      document: createDocument([table]),
      text: "头\n结",
      selection: {
        anchor: { path: [0, 0, 0, 0, 0], offset: 1 },
        focus: { path: [0, 0, 0, 1, 0], offset: 1 },
      },
    };
  }
  if (kind === "list") {
    return {
      document: createDocument([
        createBulletList([
          createListItem([createText("开头结尾", { bold: true })]),
          createListItem([createText("邻项")]),
        ]),
      ]),
      text: "头结",
      selection: {
        anchor: { path: [0, 0, 0], offset: 1 },
        focus: { path: [0, 0, 0], offset: 3 },
      },
    };
  }
  return {
    document: createDocument(paragraphs),
    text: "头\n结",
    selection: {
      anchor: { path: [0, 0], offset: 1 },
      focus: { path: [1, 0], offset: 1 },
    },
  };
}

describe("plain clipboard cut history", () => {
  for (const kind of ["paragraphs", "cell", "list"]) {
    it.each([false, true])(
      `restores ${kind} text, marks and range direction (backward: %s)`,
      (backward) => {
        const input = fixture(kind);
        const selection = backward
          ? {
              anchor: input.selection.focus,
              focus: input.selection.anchor,
            }
          : input.selection;
        const original = structuredClone(input.document);
        const copied = getClipboardText(input.document, selection);
        expect(copied).toBe(input.text);
        const result = deleteSelectionCommand.execute({
          context: { document: input.document, selection },
        });
        expect(result.ok).toBe(true);
        const after = applyTransaction(input.document, result.transaction!);
        expect(validateDocument(after).valid).toBe(true);
        const history = recordHistory({
          history: createHistoryState(),
          mergePolicy: "adjacent",
          transaction: result.transaction!,
          before: createHistorySnapshot(input.document, selection),
          after: createHistorySnapshot(after, result.selection),
        });
        expect(history.undoStack).toHaveLength(1);
        const undone = undoHistory(history)!;
        expect(undone.document).toEqual(original);
        expect(undone.selection).toEqual(selection);
        const redone = redoHistory(undone.history)!;
        expect(redone.document).toEqual(after);
        expect(redone.selection).toEqual(result.selection);
        expect(getClipboardText(undone.document, undone.selection!)).toBe(copied);
        expect(input.document).toEqual(original);
      },
    );
  }
});
