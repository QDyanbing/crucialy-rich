// @vitest-environment jsdom
import {
  createDocument,
  createParagraph,
  createText,
  createHistoryState,
  createHistorySnapshot,
  recordHistory,
  undoHistory,
  redoHistory,
} from "@crucialy-rich/core";
import { act } from "react";
import { describe, expect, it } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

describe("controlled newline History", () => {
  it.each(["insertParagraph", "insertLineBreak", "shift-enter"])(
    "restores %s separately from later typing",
    (route) => {
      const value = createDocument([createParagraph([createText("AB")])]);
      const point = { path: [0, 0], offset: 1 };
      const host = mountDeletionEditor(value, point, { value });
      if (route === "shift-enter") host.press("Enter", { shiftKey: true });
      else host.nativeInput(route);
      expect(host.ref.current!.getDocument()).toBe(value);
      expect(host.editor.textContent).toBe("AB");
      const event = host.onTransaction.mock.calls[0]![0];
      let history = recordHistory({
        history: createHistoryState(),
        transaction: event.transaction,
        before: createHistorySnapshot(event.before, event.beforeSelection),
        after: createHistorySnapshot(event.after, event.selection),
      });
      host.rerender({ value: event.after, selection: event.selection });
      expect(event).not.toHaveProperty("batch");
      expect(history.undoStack).toHaveLength(1);
      const undo = undoHistory(history)!;
      host.rerender({ value: undo.document, selection: undo.selection! });
      expect(host.editor.textContent).toBe("AB");
      expect(host.ref.current!.getSelection()!.anchor).toEqual(point);
      const redo = redoHistory(undo.history)!;
      host.rerender({ value: redo.document, selection: redo.selection! });
      act(() => {
        host.ref.current!.executeCommand("insertText", { text: "新" });
      });
      const typed = host.onTransaction.mock.calls[1]![0];
      history = recordHistory({
        history: redo.history,
        batch: "typing",
        mergePolicy: "adjacent",
        transaction: typed.transaction,
        before: createHistorySnapshot(typed.before, typed.beforeSelection),
        after: createHistorySnapshot(typed.after, typed.selection),
      });
      host.rerender({ value: typed.after, selection: typed.selection });
      expect(host.editor.textContent).toBe(
        route === "insertParagraph" ? "A新B" : "A\n新B",
      );
      expect(history.undoStack).toHaveLength(2);
      expect(undoHistory(history)!.document).toEqual(event.after);
      expect(undoHistory(undoHistory(history)!.history)!.document).toEqual(value);
      expect(host.onTransaction).toHaveBeenCalledTimes(2);
    },
  );
});
