// @vitest-environment jsdom

import {
  createDocument,
  createParagraph,
  createTable,
  createText,
  domSelectionToModelSelection,
  type DocumentNode,
  type RangeSelection,
} from "@crucialy-rich/core";
import { act, createElement, createRef } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  RichTextEditor,
  type RichTextEditorHandle,
  type RichTextEditorProps,
} from "../src";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const roots: ReturnType<typeof createRoot>[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) act(() => root.unmount());
  document.body.replaceChildren();
});

function range(row: number, column: number, paragraph = 0, offset = 0): RangeSelection {
  const point = { path: [0, row, column, paragraph, 0], offset };
  return { anchor: point, focus: { ...point, path: [...point.path] } };
}

function renderEditor(props: Partial<RichTextEditorProps> = {}) {
  const table = createTable(2, 2);
  for (const row of table.children)
    for (const cell of row.children)
      cell.children = [createParagraph([createText("文字")])];
  const value = props.value ?? props.defaultValue ?? createDocument([table]);
  const container = document.createElement("div");
  const root = createRoot(container);
  const ref = createRef<RichTextEditorHandle>();
  const onTransaction = vi.fn();
  const onChange = vi.fn();
  const onSelectionChange = vi.fn();
  const onCellSelectionChange = vi.fn();
  const onBlockSelectionChange = vi.fn();
  roots.push(root);
  document.body.append(container);
  act(() =>
    root.render(
      createElement(RichTextEditor, {
        ref,
        contentEditable: true,
        defaultValue: value,
        onTransaction,
        onChange,
        onSelectionChange,
        onCellSelectionChange,
        onBlockSelectionChange,
        ...props,
      }),
    ),
  );
  return {
    container,
    root,
    ref,
    value,
    onTransaction,
    onChange,
    onSelectionChange,
    onCellSelectionChange,
    onBlockSelectionChange,
  };
}

function select(container: HTMLElement, selection: RangeSelection) {
  function textAt(path: number[]) {
    const node = container.querySelector(
      `[data-crucialy-path="${JSON.stringify(path)}"]`,
    )?.firstChild;
    if (!node) throw new Error("Missing cell text.");
    return node;
  }
  const { anchor, focus } = selection;
  window
    .getSelection()!
    .setBaseAndExtent(
      textAt(anchor.path),
      anchor.offset,
      textAt(focus.path),
      focus.offset,
    );
}

function tab(container: HTMLElement, options: KeyboardEventInit = {}) {
  const event = new KeyboardEvent("keydown", {
    key: "Tab",
    bubbles: true,
    cancelable: true,
    ...options,
  });
  act(() => {
    container.firstElementChild?.dispatchEvent(event);
  });
  return event;
}

function domSelection(value: DocumentNode) {
  return domSelectionToModelSelection(value, window.getSelection()!);
}

describe("RichTextEditor table Tab navigation", () => {
  it.each([
    { from: range(0, 0, 0, 1), to: range(0, 1), shiftKey: false },
    { from: range(0, 1), to: range(1, 0), shiftKey: false },
    { from: range(1, 0), to: range(0, 1), shiftKey: true },
    { from: range(1, 1), to: range(1, 0), shiftKey: true },
  ])(
    "moves to $to.anchor.path without changing the document",
    ({ from, to, shiftKey }) => {
      const {
        container,
        value,
        onTransaction,
        onChange,
        onSelectionChange,
        onCellSelectionChange,
        onBlockSelectionChange,
      } = renderEditor();
      select(container, from);
      expect(tab(container, { shiftKey }).defaultPrevented).toBe(true);
      expect(domSelection(value)).toEqual(to);
      expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(to);
      expect(onCellSelectionChange).toHaveBeenCalledExactlyOnceWith({
        type: "cell",
        path: to.anchor.path.slice(0, 3),
      });
      expect(onBlockSelectionChange).toHaveBeenCalledWith(undefined);
      expect(onTransaction).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
    },
  );

  it.each([
    { from: range(0, 0), shiftKey: true },
    { from: range(1, 1), shiftKey: false },
  ])("leaves the table edge to native Tab", ({ from, shiftKey }) => {
    const { container, value, onSelectionChange, onTransaction } = renderEditor();
    select(container, from);
    expect(tab(container, { shiftKey }).defaultPrevented).toBe(false);
    expect(domSelection(value)).toEqual(from);
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(onTransaction).not.toHaveBeenCalled();
  });
});
