// @vitest-environment jsdom

import {
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createParagraph,
  createText,
  recordHistory,
  redoHistory,
  undoHistory,
  type RangeSelection,
} from "@crucialy-rich/core";
import { act, createElement, createRef } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RichTextEditor, type RichTextEditorHandle } from "../src";

vi.hoisted(() => {
  Object.defineProperty(window, "TextEvent", { configurable: true, value: InputEvent });
});
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const roots: ReturnType<typeof createRoot>[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) act(() => root.unmount());
  document.body.replaceChildren();
});

function caret(offset: number): RangeSelection {
  return {
    anchor: { path: [0, 0], offset },
    focus: { path: [0, 0], offset },
  };
}

function host() {
  let value = createDocument([createParagraph([createText("原文")])]);
  let selection = caret(1);
  let history = createHistoryState();
  const transactions = vi.fn();
  const ref = createRef<RichTextEditorHandle>();
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  function render() {
    root.render(
      createElement(RichTextEditor, {
        ref,
        contentEditable: true,
        value,
        selection,
        onSelectionChange(next) {
          selection = next;
          render();
        },
        onTransaction(event) {
          transactions(event);
          history = recordHistory({
            history,
            mergePolicy: "adjacent",
            ...(event.batch ? { batch: event.batch } : {}),
            before: createHistorySnapshot(event.before, event.beforeSelection),
            after: createHistorySnapshot(event.after, event.selection),
            transaction: event.transaction,
          });
          value = event.after;
          if (event.selection) selection = event.selection;
          render();
        },
      }),
    );
  }
  act(render);
  return {
    ref,
    transactions,
    history: () => history,
    type(text: string) {
      act(() =>
        ref.current!.getElement()!.dispatchEvent(
          new InputEvent("textInput", {
            bubbles: true,
            cancelable: true,
            data: text,
            inputType: "insertText",
          }),
        ),
      );
    },
    move(offset: number) {
      act(() => {
        selection = caret(offset);
        render();
      });
    },
    restore(action: "undo" | "redo") {
      act(() => {
        const change = action === "undo" ? undoHistory(history) : redoHistory(history);
        if (!change) throw new Error("Expected a history change.");
        history = change.history;
        value = change.document;
        selection = change.selection!;
        render();
      });
    },
  };
}

describe("controlled editor with saved host history checkpoints", () => {
  it("restores and continues editing after a retained pre-append history is mutated", () => {
    const editor = host();
    editor.type("甲");
    const checkpoint = editor.history();
    editor.move(0);
    editor.type("乙");
    const expected = structuredClone(editor.history());
    checkpoint.undoStack[0]!.before.document.children.length = 0;
    checkpoint.undoStack[0]!.before.selection!.anchor.path[0] = 99;
    checkpoint.undoStack[0]!.transaction.operations.length = 0;
    expect(editor.history()).toEqual(expected);
    editor.restore("undo");
    expect(editor.ref.current!.getElement()!.textContent).toBe("原甲文");
    editor.restore("redo");
    expect(editor.ref.current!.getElement()!.textContent).toBe("乙原甲文");
    editor.type("丙");
    expect(editor.ref.current!.getElement()!.textContent).toBe("乙丙原甲文");
    expect(editor.transactions).toHaveBeenCalledTimes(3);
  });

  it("keeps a merged typing batch independent of its earlier checkpoint", () => {
    const editor = host();
    editor.type("甲");
    const checkpoint = editor.history();
    editor.type("乙");
    const expected = structuredClone(editor.history());
    checkpoint.undoStack[0]!.after.document.children.length = 0;
    checkpoint.undoStack[0]!.before.selection!.focus.offset = 99;
    expect(editor.history()).toEqual(expected);
    expect(editor.history().undoStack).toHaveLength(1);
    editor.restore("undo");
    expect(editor.ref.current!.getElement()!.textContent).toBe("原文");
    expect(editor.ref.current!.getSelection()).toEqual(caret(1));
    editor.restore("redo");
    expect(editor.ref.current!.getElement()!.textContent).toBe("原甲乙文");
  });

  it("preserves a saved redo branch when a new branch is edited", () => {
    const editor = host();
    editor.type("甲");
    editor.move(0);
    editor.type("乙");
    editor.restore("undo");
    const saved = editor.history();
    const expected = structuredClone(saved);
    editor.type("新");
    expect(editor.history().redoStack).toEqual([]);
    editor.history().undoStack[0]!.transaction.operations.length = 0;
    expect(saved).toEqual(expected);
    expect(redoHistory(saved)!.document).toEqual(expected.redoStack[0]!.after.document);
    expect(editor.ref.current!.getElement()!.textContent).toBe("新原甲文");
  });
});
