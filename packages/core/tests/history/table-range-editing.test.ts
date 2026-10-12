import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createParagraph,
  createTableCell,
  createTableRow,
  createText,
  deleteSelectionCommand,
  insertTextCommand,
  recordHistory,
  redoHistory,
  splitBlockCommand,
  undoHistory,
  type RangeSelection,
} from "../../src";

function tableDocument(texts: string[]) {
  const cell = (text: string) => createTableCell([createParagraph([createText(text)])]);
  return createDocument([
    createParagraph([createText("表格前方")]),
    {
      children: [
        createTableRow([cell("表头一"), cell("表头二")]),
        createTableRow([
          cell("邻格"),
          createTableCell(texts.map((text) => createParagraph([createText(text)]))),
        ]),
      ],
      type: "table",
    },
  ]);
}

const selection: RangeSelection = {
  anchor: { path: [1, 1, 1, 1, 0], offset: 1 },
  focus: { path: [1, 1, 1, 0, 0], offset: 1 },
};

describe("table range editing history", () => {
  it.each([
    { command: deleteSelectionCommand, texts: ["开尾"], caret: [0, 1] },
    { command: insertTextCommand, texts: ["开新尾"], caret: [0, 2] },
    { command: splitBlockCommand, texts: ["开", "尾"], caret: [1, 0] },
  ])("undoes and redoes $command.name as one entry", ({ command, texts, caret }) => {
    const document = tableDocument(["开头", "结尾"]);
    const result = command.execute({
      context: { document, selection },
      payload: { text: "新" },
    });
    if (!result.transaction || !result.selection) {
      throw new Error("Range editing must return a transaction and selection.");
    }
    const after = applyTransaction(document, result.transaction);
    const history = recordHistory({
      after: createHistorySnapshot(after, result.selection),
      before: createHistorySnapshot(document, selection),
      history: createHistoryState(),
      transaction: result.transaction,
    });

    expect(after).toEqual(tableDocument(texts));
    expect(result.selection.anchor).toEqual({
      path: [1, 1, 1, caret[0], 0],
      offset: caret[1],
    });
    expect(history.undoStack).toHaveLength(1);
    const undone = undoHistory(history);
    expect(undone?.document).toEqual(document);
    expect(undone?.selection).toEqual(selection);
    expect(undone?.history.undoStack).toHaveLength(0);
    expect(undone?.history.redoStack).toHaveLength(1);
    const redone = redoHistory(undone!.history);
    expect(redone?.document).toEqual(after);
    expect(redone?.selection).toEqual(result.selection);
    expect(redone?.history.undoStack).toHaveLength(1);
    expect(redone?.history.redoStack).toHaveLength(0);
  });

  it("clears redo when a new replacement follows undo", () => {
    const document = tableDocument(["开头", "结尾"]);
    const first = insertTextCommand.execute({
      context: { document, selection },
      payload: { text: "旧" },
    });
    const history = recordHistory({
      after: createHistorySnapshot(
        applyTransaction(document, first.transaction!),
        first.selection,
      ),
      before: createHistorySnapshot(document, selection),
      history: createHistoryState(),
      transaction: first.transaction!,
    });
    const undone = undoHistory(history)!;
    const second = insertTextCommand.execute({
      context: { document: undone.document, selection },
      payload: { text: "新" },
    });
    const next = recordHistory({
      after: createHistorySnapshot(
        applyTransaction(undone.document, second.transaction!),
        second.selection,
      ),
      before: createHistorySnapshot(undone.document, selection),
      history: undone.history,
      transaction: second.transaction!,
    });

    expect(next.redoStack).toHaveLength(0);
    expect(redoHistory(next)).toBeUndefined();
    expect(undoHistory(next)?.selection).toEqual(selection);
    expect(next.undoStack[0]?.after.document).toEqual(tableDocument(["开新尾"]));
  });
});
