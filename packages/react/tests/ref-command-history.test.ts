// @vitest-environment jsdom
import {
  BOLD_COMMAND_NAME,
  createBlockSelection,
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createImage,
  createParagraph,
  createText,
  DELETE_IMAGE_COMMAND_NAME,
  recordHistory,
  redoHistory,
  undoHistory,
} from "@crucialy-rich/core";
import { act } from "react";
import { describe, expect, it } from "vitest";
import { type RichTextEditorTransactionEvent } from "../src";
import { mountDeletionEditor } from "./deletion-fixture";

describe("ref command History integration", () => {
  for (const controlled of [false, true]) {
    it.each([false, true])(
      `records an independent range in controlled mode ${controlled}, reverse %s`,
      (reverse) => {
        const value = createDocument([createParagraph([createText("历史正文")])]);
        const start = { path: [0, 0], offset: 0 },
          end = { path: [0, 0], offset: 2 };
        const selection = {
          anchor: reverse ? end : start,
          focus: reverse ? start : end,
        };
        let history = createHistoryState();
        let captured: RichTextEditorTransactionEvent | undefined;
        const host = mountDeletionEditor(value, undefined, {
          selection,
          ...(controlled ? { value } : {}),
          onTransaction(event) {
            captured = event;
            history = recordHistory({
              history,
              transaction: event.transaction,
              before: createHistorySnapshot(event.before, event.beforeSelection),
              after: createHistorySnapshot(event.after, event.selection),
            });
          },
        });
        window.getSelection()!.removeAllRanges();
        act(() => {
          const result = host.ref.current!.executeCommand(BOLD_COMMAND_NAME);
          expect(result.ok).toBe(true);
          result.selection!.anchor.offset = 99;
          result.selection!.focus.path[0] = 99;
        });
        expect(history.undoStack).toHaveLength(1);
        const after = structuredClone(captured!.after);
        const finalRange = structuredClone(captured!.selection);
        captured!.beforeSelection!.anchor.path[0] = 99;
        captured!.selection.focus.offset = 99;
        const undo = undoHistory(history)!;
        expect(undo.document).toEqual(value);
        expect(undo.selection).toEqual(selection);
        const redo = redoHistory(undo.history)!;
        expect(redo.document).toEqual(after);
        expect(redo.selection).toEqual(finalRange);
        host.rerender({ value: undo.document, selection: undo.selection! });
        expect(host.ref.current!.getDocument()).toEqual(value);
      },
    );
  }
  it("lets the host record explicit block context without inventing a text range", () => {
    const value = createDocument([createImage("https://example.com/image.png")]);
    const block = createBlockSelection([0]);
    let history = createHistoryState();
    const host = mountDeletionEditor(value, undefined, {
      onTransaction(event) {
        expect(event.beforeSelection).toBeUndefined();
        history = recordHistory({
          history,
          transaction: event.transaction,
          before: createHistorySnapshot(event.before, event.beforeSelection, block),
          after: createHistorySnapshot(event.after, event.selection),
        });
      },
    });
    window.getSelection()!.removeAllRanges();
    act(() =>
      host.ref.current!.executeCommand(DELETE_IMAGE_COMMAND_NAME, { selection: block }),
    );
    const undo = undoHistory(history)!;
    expect(undo.document).toEqual(value);
    expect(undo.selection).toBeUndefined();
    expect(undo.blockSelection).toEqual(block);
    expect(redoHistory(undo.history)!.document.children).toEqual([createParagraph()]);
  });
});
