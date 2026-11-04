import { describe, expect, it } from "vitest";
import { createHistoryState, recordHistory, redoHistory, undoHistory } from "../../src";
import { isolationEntry, mutateEntry, mutateSnapshot } from "./isolation-fixture";

function setup() {
  const entry = isolationEntry();
  const history = createHistoryState([entry], [entry, entry]);
  return { history, change: redoHistory(history)! };
}

describe("redo result ownership", () => {
  it("isolates all output channels from later input stack edits", () => {
    const { history, change } = setup();
    const expected = structuredClone(change);
    for (const entry of [...history.undoStack, ...history.redoStack])
      mutateEntry(entry);
    expect(change).toEqual(expected);
  });

  it("keeps restored content independent of both stacks and the diagnostic entry", () => {
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
    expect(undoHistory(change.history)!.document).toEqual(
      expectedEntry.before.document,
    );
  });

  it("separates the diagnostic entry and all retained or moved entries", () => {
    const { history, change } = setup();
    const expectedInput = structuredClone(history);
    const expectedMoved = structuredClone(change.history.undoStack.at(-1));
    const expectedDocument = structuredClone(change.document);
    mutateEntry(change.entry);
    mutateEntry(change.history.undoStack[0]!);
    mutateEntry(change.history.redoStack[0]!);
    expect(change.history.undoStack.at(-1)).toEqual(expectedMoved);
    expect(change.document).toEqual(expectedDocument);
    expect(history).toEqual(expectedInput);
  });

  it("lets a saved redo branch survive independent new edits", () => {
    const { history, change } = setup();
    const expected = structuredClone(change.history);
    const branch = recordHistory({
      history: change.history,
      mergePolicy: "adjacent",
      ...isolationEntry(),
    });
    expect(branch.redoStack).toEqual([]);
    for (const entry of branch.undoStack) mutateEntry(entry);
    expect(change.history).toEqual(expected);
    expect(redoHistory(change.history)).toBeDefined();
    expect(redoHistory(history)!.history).toEqual(expected);
  });
});
