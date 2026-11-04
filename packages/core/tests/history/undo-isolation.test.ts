import { describe, expect, it } from "vitest";
import { createHistoryState, redoHistory, undoHistory } from "../../src";
import { isolationEntry, mutateEntry, mutateSnapshot } from "./isolation-fixture";

function setup() {
  const entry = isolationEntry();
  const history = createHistoryState([entry, entry], [entry]);
  return { history, change: undoHistory(history)! };
}

describe("undo result ownership", () => {
  it("isolates all output channels from later input stack edits", () => {
    const { history, change } = setup();
    const expected = structuredClone(change);
    for (const entry of [...history.undoStack, ...history.redoStack])
      mutateEntry(entry);
    history.undoStack.length = 0;
    history.redoStack.length = 0;
    expect(change).toEqual(expected);
  });

  it("keeps restored model and selections independent of returned entries and stacks", () => {
    const { history, change } = setup();
    const expectedInput = structuredClone(history);
    const expectedEntry = structuredClone(change.entry);
    const expectedHistory = structuredClone(change.history);
    mutateSnapshot({
      document: change.document,
      selection: change.selection!,
      blockSelection: change.blockSelection!,
    });
    expect(history).toEqual(expectedInput);
    expect(change.entry).toEqual(expectedEntry);
    expect(change.history).toEqual(expectedHistory);
    expect(redoHistory(change.history)!.document).toEqual(expectedEntry.after.document);
  });

  it("does not let the diagnostic entry corrupt restored content or future redo", () => {
    const { history, change } = setup();
    const expectedInput = structuredClone(history);
    const expectedDocument = structuredClone(change.document);
    const expectedHistory = structuredClone(change.history);
    mutateEntry(change.entry);
    expect(change.document).toEqual(expectedDocument);
    expect(change.history).toEqual(expectedHistory);
    expect(history).toEqual(expectedInput);
    expect(redoHistory(change.history)!.blockSelection).toEqual({
      type: "block",
      path: [3],
    });
  });

  it("separates retained entries from the moved entry and the old state", () => {
    const { history, change } = setup();
    const expectedInput = structuredClone(history);
    const expectedMoved = structuredClone(change.history.redoStack.at(-1));
    const expectedEntry = structuredClone(change.entry);
    mutateEntry(change.history.undoStack[0]!);
    mutateEntry(change.history.redoStack[0]!);
    expect(change.history.redoStack.at(-1)).toEqual(expectedMoved);
    expect(change.entry).toEqual(expectedEntry);
    expect(history).toEqual(expectedInput);
  });
});
