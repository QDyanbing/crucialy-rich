import { describe, expect, it } from "vitest";

import {
  createCommandRegistry,
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createInsertTextOperation,
  createParagraph,
  createText,
  createTransaction,
  executeCommand,
  REDO_COMMAND_NAME,
  redoCommand,
  UNDO_COMMAND_NAME,
  undoCommand,
  type HistoryEntry,
} from "../../src";

function createSnapshot(text: string) {
  return createHistorySnapshot(createDocument([createParagraph([createText(text)])]), {
    anchor: { path: [0, 0], offset: text.length },
    focus: { path: [0, 0], offset: text.length },
  });
}

function createEntry(before: string, after: string): HistoryEntry {
  return {
    after: createSnapshot(after),
    before: createSnapshot(before),
    transaction: createTransaction([
      createInsertTextOperation({ path: [0, 0], offset: before.length }, after),
    ]),
  };
}

describe("history commands", () => {
  it("executes undo through the command registry", () => {
    const entry = createEntry("你", "你好");
    const history = createHistoryState([entry]);
    const registry = createCommandRegistry([undoCommand, redoCommand]);

    const result = executeCommand(registry, UNDO_COMMAND_NAME, {
      context: { document: createSnapshot("你好").document },
      payload: { history },
    });

    expect(result).toMatchObject({
      commandName: UNDO_COMMAND_NAME,
      document: createSnapshot("你").document,
      ok: true,
      selection: {
        anchor: { path: [0, 0], offset: 1 },
        focus: { path: [0, 0], offset: 1 },
      },
      status: "success",
    });
    expect(result.history?.undoStack).toEqual([]);
    expect(result.history?.redoStack).toEqual([entry]);
  });

  it("executes redo through the command registry", () => {
    const entry = createEntry("你", "你好");
    const history = createHistoryState([], [entry]);
    const registry = createCommandRegistry([undoCommand, redoCommand]);

    const result = executeCommand(registry, REDO_COMMAND_NAME, {
      context: { document: createSnapshot("你").document },
      payload: { history },
    });

    expect(result).toMatchObject({
      commandName: REDO_COMMAND_NAME,
      document: createSnapshot("你好").document,
      ok: true,
      selection: {
        anchor: { path: [0, 0], offset: 2 },
        focus: { path: [0, 0], offset: 2 },
      },
      status: "success",
    });
    expect(result.history?.undoStack).toEqual([entry]);
    expect(result.history?.redoStack).toEqual([]);
  });

  it("skips history commands without usable history", () => {
    const context = { document: createSnapshot("你好").document };

    expect(undoCommand.execute({ context })).toMatchObject({
      ok: false,
      reason: "Undo command requires history payload.",
      status: "skipped",
    });
    expect(
      redoCommand.execute({ context, payload: { history: createHistoryState() } }),
    ).toMatchObject({
      ok: false,
      reason: "Nothing to redo.",
      status: "skipped",
    });
  });
});
