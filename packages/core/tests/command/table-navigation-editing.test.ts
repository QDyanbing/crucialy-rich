import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createParagraph,
  createTable,
  createText,
  getAdjacentCellSelection,
  getNodeAtPath,
  insertTextCommand,
  parsePlainText,
  pasteCommand,
  recordHistory,
  redoHistory,
  splitBlockCommand,
  undoHistory,
} from "../../src";

function range(row: number, column: number, paragraph = 0, offset = 0) {
  const point = { path: [0, row, column, paragraph, 0], offset };
  return { anchor: point, focus: { ...point, path: [...point.path] } };
}

describe("table navigation after editing", () => {
  it("moves from the last filled TSV cell using current paste selection", () => {
    const document = createDocument([createTable(2, 3)]);
    const result = pasteCommand.execute({
      context: { document, selection: range(0, 0) },
      payload: { fragment: parsePlainText("甲\t乙\n丙\t丁")! },
    });
    const after = applyTransaction(document, result.transaction!);
    expect(result.selection).toEqual(range(1, 1, 0, 1));
    expect(getAdjacentCellSelection(after, result.selection!)).toEqual(range(1, 2));
    expect(getAdjacentCellSelection(after, result.selection!, "previous")).toEqual(
      range(1, 0),
    );
  });

  it("moves out of a newly split paragraph and lands on the first empty destination paragraph", () => {
    const table = createTable(1, 2);
    table.children[0]!.children[0]!.children = [createParagraph([createText("前后")])];
    table.children[0]!.children[1]!.children = [
      createParagraph(),
      createParagraph([createText("第二段")]),
    ];
    const document = createDocument([table]);
    const result = splitBlockCommand.execute({
      context: { document, selection: range(0, 0, 0, 1) },
    });
    const after = applyTransaction(document, result.transaction!);
    expect(result.selection).toEqual(range(0, 0, 1));
    expect(getAdjacentCellSelection(after, result.selection!)).toEqual(range(0, 1));
    expect(getNodeAtPath(after, [0, 0, 0])).toMatchObject({
      children: [
        createParagraph([createText("前")]),
        createParagraph([createText("后")]),
      ],
    });
  });

  it("undoes typing after navigation without introducing a navigation history entry", () => {
    const document = createDocument([createTable(1, 2)]);
    const target = getAdjacentCellSelection(document, range(0, 0))!;
    const before = JSON.stringify(document);
    const input = insertTextCommand.execute({
      context: { document, selection: target },
      payload: { text: "续" },
    });
    const after = applyTransaction(document, input.transaction!);
    const history = recordHistory({
      history: createHistoryState(),
      before: createHistorySnapshot(document, target),
      after: createHistorySnapshot(after, input.selection!),
      transaction: input.transaction!,
    });
    expect(history.undoStack).toHaveLength(1);
    expect(JSON.stringify(document)).toBe(before);
    const undone = undoHistory(history)!;
    expect(undone.document).toEqual(document);
    expect(undone.selection).toEqual(target);
    const redone = redoHistory(undone.history)!;
    expect(redone.document).toEqual(after);
    expect(
      getAdjacentCellSelection(redone.document, redone.selection!, "previous"),
    ).toEqual(range(0, 0));
  });
});
