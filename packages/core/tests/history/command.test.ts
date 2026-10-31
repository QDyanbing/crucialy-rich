import { describe, expect, it } from "vitest";

import {
  createBlockSelection,
  createImage,
  createRemoveBlockOperation,
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
  it.each(["undo", "redo"] as const)(
    "forwards detached block selection through %s command",
    (action) => {
      const document = createDocument([createImage("https://example.com/a.png")]);
      const snapshot = createHistorySnapshot(
        document,
        undefined,
        createBlockSelection([0]),
      );
      const entry = {
        before: snapshot,
        after: snapshot,
        transaction: createTransaction([createRemoveBlockOperation([0])]),
      };
      const history =
        action === "undo"
          ? createHistoryState([entry])
          : createHistoryState([], [entry]);
      const original = structuredClone(history);
      const result = executeCommand(
        createCommandRegistry([undoCommand, redoCommand]),
        action,
        {
          context: { document },
          payload: { history },
        },
      );
      expect(result.ok).toBe(true);
      expect(result.blockSelection).toEqual(createBlockSelection([0]));
      expect(result).not.toHaveProperty("selection");
      expect(result).not.toHaveProperty("transaction");
      result.blockSelection!.path[0] = 8;
      expect(history).toEqual(original);
      const stored = result.history!.undoStack[0] ?? result.history!.redoStack[0];
      expect(stored!.before.blockSelection).toEqual(createBlockSelection([0]));
    },
  );
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
