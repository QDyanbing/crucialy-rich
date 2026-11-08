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

describe("host-owned composition History", () => {
  it.each(["caret", "forward-range", "backward-range"])(
    "records one final replacement and restores %s",
    (mode) => {
      const value = createDocument([
        createParagraph([createText("前甲", { bold: true })]),
        createParagraph([createText("乙后", { italic: true })]),
      ]);
      const point = { path: [0, 0], offset: 1 };
      const host = mountDeletionEditor(value, point, { value });
      const end = { path: [1, 0], offset: 1 };
      const selection =
        mode === "caret"
          ? { anchor: point, focus: point }
          : mode === "forward-range"
            ? { anchor: point, focus: end }
            : { anchor: end, focus: point };
      const text = host.editor.querySelectorAll("p")[1]!.firstChild!.firstChild!;
      const first = host.editor.querySelectorAll("p")[0]!.firstChild!.firstChild!;
      window
        .getSelection()!
        .setBaseAndExtent(
          mode === "backward-range" ? text : first,
          1,
          mode === "caret" || mode === "backward-range" ? first : text,
          1,
        );
      host.compose("compositionstart");
      host.setCaret({ path: [0, 0], offset: 0 });
      host.compose("compositionupdate", "中");
      host.compose("compositionupdate", "中文");
      expect(host.onTransaction).not.toHaveBeenCalled();
      host.compose("compositionend", "中文");
      expect(host.ref.current!.getDocument()).toBe(value);
      expect(host.onTransaction).toHaveBeenCalledTimes(1);
      const event = host.onTransaction.mock.calls[0]![0];
      expect(event.beforeSelection).toEqual(selection);
      expect(event.batch).toBe("composition");
      let history = recordHistory({
        history: createHistoryState(),
        batch: event.batch,
        transaction: event.transaction,
        before: createHistorySnapshot(event.before, event.beforeSelection),
        after: createHistorySnapshot(event.after, event.selection),
      });
      host.rerender({ value: event.after, selection: event.selection });
      const undo = undoHistory(history)!;
      expect(undo.document).toEqual(value);
      expect(undo.selection).toEqual(selection);
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
      expect(history.undoStack).toHaveLength(2);
      expect(undoHistory(history)!.document).toEqual(event.after);
    },
  );

  it("retains the existing composition batch merge policy across separate sessions", () => {
    const host = mountDeletionEditor(
      createDocument([createParagraph([createText("AB")])]),
      { path: [0, 0], offset: 1 },
    );
    host.compose("compositionstart");
    host.compose("compositionend", "中");
    host.setCaret({ path: [0, 0], offset: 2 });
    host.compose("compositionstart");
    host.compose("compositionend", "文");
    let history = createHistoryState();
    for (const [event] of host.onTransaction.mock.calls)
      history = recordHistory({
        history,
        batch: event.batch,
        mergePolicy: "adjacent",
        transaction: event.transaction,
        before: createHistorySnapshot(event.before, event.beforeSelection),
        after: createHistorySnapshot(event.after, event.selection),
      });
    expect(host.onTransaction).toHaveBeenCalledTimes(2);
    expect(host.editor.textContent).toBe("A中文B");
    expect(history.undoStack).toHaveLength(1);
    expect(undoHistory(history)!.document).toEqual(
      createDocument([createParagraph([createText("AB")])]),
    );
  });
});
