// @vitest-environment jsdom

import {
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createParagraph,
  createTable,
  createText,
  undoHistory,
  recordHistory,
  type HistoryMergePolicy,
  type RangeSelection,
} from "@crucialy-rich/core";
import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RichTextEditor } from "../src";

vi.hoisted(() => {
  Object.defineProperty(window, "TextEvent", {
    configurable: true,
    value: InputEvent,
  });
});
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const roots: ReturnType<typeof createRoot>[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) act(() => root.unmount());
  document.body.replaceChildren();
});

function caret(column: number, offset = 1): RangeSelection {
  const path = [0, 0, column, 0, 0];
  return { anchor: { path, offset }, focus: { path: [...path], offset } };
}

function renderHost(mergePolicy: HistoryMergePolicy = "adjacent") {
  const table = createTable(1, 2);
  for (const cell of table.children[0]!.children)
    cell.children = [createParagraph([createText("文字")])];
  const initial = createDocument([table]);
  let history = createHistoryState();
  const transactions = vi.fn();
  const container = document.createElement("div");
  const root = createRoot(container);
  roots.push(root);
  document.body.append(container);
  function Host() {
    const [value, setValue] = useState(initial);
    const [selection, setSelection] = useState(caret(0));
    return createElement(RichTextEditor, {
      contentEditable: true,
      value,
      selection,
      onSelectionChange: setSelection,
      onTransaction: (event) => {
        transactions(event);
        history = recordHistory({
          history,
          mergePolicy,
          ...(event.batch ? { batch: event.batch } : {}),
          transaction: event.transaction,
          before: createHistorySnapshot(event.before, event.beforeSelection),
          after: createHistorySnapshot(event.after, event.selection),
        });
        setValue(event.after);
        if (event.selection) setSelection(event.selection);
      },
    });
  }
  act(() => root.render(createElement(Host)));
  const editor = container.firstElementChild as HTMLElement;
  function type(text: string) {
    act(() => {
      editor.dispatchEvent(
        new InputEvent("textInput", {
          bubbles: true,
          cancelable: true,
          data: text,
          inputType: "insertText",
        }),
      );
    });
  }
  function move(selection: RangeSelection) {
    const node = container.querySelector(
      `[data-crucialy-path="${JSON.stringify(selection.anchor.path)}"]`,
    )!.firstChild!;
    const range = document.createRange();
    range.setStart(node, selection.anchor.offset);
    range.collapse(true);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(range);
    act(() => editor.dispatchEvent(new MouseEvent("mouseup", { bubbles: true })));
  }
  function tab() {
    act(() => {
      editor.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Tab",
          bubbles: true,
          cancelable: true,
        }),
      );
    });
  }
  return { container, initial, transactions, type, move, tab, history: () => history };
}

describe("React transactions with host-owned adjacent history", () => {
  it("merges contiguous input emitted by the controlled editor", () => {
    const host = renderHost();
    host.type("甲");
    host.type("乙");
    expect(host.transactions).toHaveBeenCalledTimes(2);
    expect(host.history().undoStack).toHaveLength(1);
    expect(host.container.querySelector("td")?.textContent).toBe("文甲乙字");
    expect(undoHistory(host.history())?.document).toEqual(host.initial);
  });

  it("keeps edits on both sides of table Tab independent without recording navigation", () => {
    const host = renderHost();
    host.type("甲");
    host.tab();
    expect(host.transactions).toHaveBeenCalledTimes(1);
    host.type("乙");
    expect(host.history().undoStack).toHaveLength(2);
    expect(host.transactions.mock.calls[1]?.[0].beforeSelection).toEqual(caret(1, 0));
    const undone = undoHistory(host.history())!;
    expect(undone.selection).toEqual(caret(1, 0));
    expect(undone.document).toEqual(host.transactions.mock.calls[0]?.[0].after);
    expect(undoHistory(undone.history)?.document).toEqual(host.initial);
  });

  it("starts a new entry for a mouse caret jump in the same text node", () => {
    const host = renderHost();
    host.type("甲");
    host.move(caret(0, 0));
    host.type("乙");
    expect(host.history().undoStack).toHaveLength(2);
    expect(undoHistory(host.history())?.selection).toEqual(caret(0, 0));
    expect(host.container.querySelector("td")?.textContent).toBe("乙文甲字");
  });

  it("lets the host retain legacy batch merging across table navigation", () => {
    const host = renderHost("batch");
    host.type("甲");
    host.tab();
    host.type("乙");
    expect(host.transactions).toHaveBeenCalledTimes(2);
    expect(host.history().undoStack).toHaveLength(1);
    expect(undoHistory(host.history())?.document).toEqual(host.initial);
  });
});
