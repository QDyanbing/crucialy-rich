import { describe, expect, it } from "vitest";
import { createHistoryState } from "../../src";
import { isolationEntry, mutateEntry } from "./isolation-fixture";

describe("history initialization ownership", () => {
  it("detaches repeated entries across stacks and slots", () => {
    const entry = isolationEntry();
    const history = createHistoryState([entry, entry], [entry]);
    const expected = isolationEntry();
    mutateEntry(entry);
    expect(history.undoStack).toEqual([expected, expected]);
    expect(history.redoStack).toEqual([expected]);
    mutateEntry(history.undoStack[0]!);
    expect(history.undoStack[1]).toEqual(expected);
    expect(history.redoStack[0]).toEqual(expected);
  });

  it("keeps separately initialized histories independent", () => {
    const entry = isolationEntry();
    const first = createHistoryState([entry], [entry]);
    const second = createHistoryState(first.undoStack, first.redoStack);
    const expected = structuredClone(second);
    mutateEntry(first.undoStack[0]!);
    mutateEntry(first.redoStack[0]!);
    expect(second).toEqual(expected);
  });

  it("does not alias before, after, and inserted block trees", () => {
    const entry = isolationEntry();
    entry.after = entry.before;
    const state = createHistoryState([entry]);
    const expected = structuredClone(state.undoStack[0]!.after);
    mutateEntry(entry);
    expect(state.undoStack[0]!.before).toEqual(expected);
    expect(state.undoStack[0]!.after).toEqual(expected);
    state.undoStack[0]!.before.document.children.length = 0;
    expect(state.undoStack[0]!.after).toEqual(expected);
    expect(state.undoStack[0]!.transaction.operations[0]!.type).toBe("insert_block");
  });
});
