import { describe, expect, it } from "vitest";
import {
  createCommandRegistry,
  createHistoryState,
  executeCommand,
  redoCommand,
  undoCommand,
} from "../../src";
import { isolationEntry, mutateEntry, mutateSnapshot } from "./isolation-fixture";

describe.each(["undo", "redo"] as const)("%s command ownership", (action) => {
  function setup() {
    const entry = isolationEntry();
    const history = createHistoryState([entry], [entry]);
    const registry = createCommandRegistry([undoCommand, redoCommand]);
    const run = (name = action) =>
      executeCommand(registry, name, {
        context: { document: entry.after.document },
        payload: { history },
      });
    return { entry, history, run };
  }

  it("does not share result data with the history payload", () => {
    const { history, run } = setup();
    const result = run();
    expect(result.status).toBe("success");
    expect(result).not.toHaveProperty("transaction");
    const expected = structuredClone(result);
    mutateEntry(history.undoStack[0]!);
    mutateEntry(history.redoStack[0]!);
    expect(result).toEqual(expected);
  });

  it("separates restored model and selections from returned history", () => {
    const { history, run } = setup();
    const result = run();
    const expectedInput = structuredClone(history);
    const expectedHistory = structuredClone(result.history);
    mutateSnapshot({
      document: result.document!,
      selection: result.selection!,
      blockSelection: result.blockSelection!,
    });
    expect(history).toEqual(expectedInput);
    expect(result.history).toEqual(expectedHistory);
  });

  it("can execute twice against the same payload without aliasing results", () => {
    const { history, run } = setup();
    const first = run();
    const second = run();
    const expected = structuredClone(second);
    for (const entry of [...first.history!.undoStack, ...first.history!.redoStack])
      mutateEntry(entry);
    first.selection!.anchor.path[0] = 99;
    expect(second).toEqual(expected);
    expect(run()).toEqual(expected);
    expect(history.undoStack).toHaveLength(1);
    expect(history.redoStack).toHaveLength(1);
  });
});
