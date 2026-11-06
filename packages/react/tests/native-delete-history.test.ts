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

describe.each(["deleteContentBackward", "deleteContentForward"])(
  "controlled native %s",
  (type) => {
    it("waits for host acceptance and supports undo redo and independent continued input", () => {
      const value = createDocument([createParagraph([createText("A\u{1f600}B")])]);
      const point = { path: [0, 0], offset: type === "deleteContentBackward" ? 3 : 1 };
      const host = mountDeletionEditor(value, point, { value });
      host.nativeInput(type);
      expect(host.ref.current!.getDocument()).toBe(value);
      expect(host.editor.textContent).toBe("A\u{1f600}B");
      const event = host.onTransaction.mock.calls[0]![0];
      let history = recordHistory({
        history: createHistoryState(),
        transaction: event.transaction,
        before: createHistorySnapshot(event.before, event.beforeSelection),
        after: createHistorySnapshot(event.after, event.selection),
      });
      host.rerender({ value: event.after, selection: event.selection });
      expect(host.editor.textContent).toBe("AB");
      const undo = undoHistory(history)!;
      host.rerender({ value: undo.document, selection: undo.selection! });
      expect(host.editor.textContent).toBe("A\u{1f600}B");
      expect(host.ref.current!.getSelection()!.anchor).toEqual(point);
      const redo = redoHistory(undo.history)!;
      host.rerender({ value: redo.document, selection: redo.selection! });
      act(() => {
        host.ref.current!.executeCommand("insertText", { text: "新" });
      });
      const typed = host.onTransaction.mock.calls[1]![0];
      history = recordHistory({
        history: redo.history,
        transaction: typed.transaction,
        before: createHistorySnapshot(typed.before, typed.beforeSelection),
        after: createHistorySnapshot(typed.after, typed.selection),
      });
      host.rerender({ value: typed.after, selection: typed.selection });
      expect(host.editor.textContent).toBe("A新B");
      expect(history.undoStack).toHaveLength(2);
      expect(undoHistory(history)!.document).toEqual(event.after);
      expect(host.onTransaction).toHaveBeenCalledTimes(2);
    });

    it("calls native host policy before transaction and selection notifications", () => {
      const order: string[] = [];
      const host = mountDeletionEditor(
        createDocument([createParagraph([createText("AB")])]),
        { path: [0, 0], offset: 1 },
        {
          onNativeBeforeInput: () => order.push("native"),
          onChange: () => order.push("change"),
          onTransaction: () => order.push("transaction"),
          onSelectionChange: () => order.push("selection"),
        },
      );
      host.nativeInput(type);
      expect(order).toEqual(["native", "change", "transaction", "selection"]);
    });
  },
);
