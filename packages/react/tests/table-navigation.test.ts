// @vitest-environment jsdom

import {
  createDocument,
  createBulletList,
  createListItem,
  createCommandRegistry,
  createParagraph,
  createTable,
  createText,
  domSelectionToModelSelection,
  type DocumentNode,
  type RangeSelection,
  type CellSelection,
} from "@crucialy-rich/core";
import { act, createElement, createRef, useState } from "react";
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
  it.each([{ ctrlKey: true }, { altKey: true }, { metaKey: true }])(
    "does not intercept modified Tab %j",
    (keys) => {
      const { container, value, onSelectionChange, onTransaction } = renderEditor();
      const selection = range(0, 0);
      select(container, selection);
      expect(tab(container, keys).defaultPrevented).toBe(false);
      expect(domSelection(value)).toEqual(selection);
      expect(onSelectionChange).not.toHaveBeenCalled();
      expect(onTransaction).not.toHaveBeenCalled();
    },
  );

  it("leaves readonly navigation to the host", () => {
    const { container, onSelectionChange } = renderEditor({ contentEditable: false });
    select(container, range(0, 0));
    expect(tab(container).defaultPrevented).toBe(false);
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it("honors host cancellation before moving the caret", () => {
    const { container, value, onSelectionChange } = renderEditor({
      onKeyDown: (event) => event.preventDefault(),
    });
    const selection = range(0, 0);
    select(container, selection);
    expect(tab(container).defaultPrevented).toBe(true);
    expect(domSelection(value)).toEqual(selection);
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it.each(["state", "native"])("does not navigate during %s composition", (mode) => {
    const { container, value, onSelectionChange, onTransaction } = renderEditor();
    const selection = range(0, 0);
    select(container, selection);
    if (mode === "state")
      act(() => {
        container.firstElementChild?.dispatchEvent(
          new CompositionEvent("compositionstart", { bubbles: true }),
        );
      });
    expect(tab(container, { isComposing: mode === "native" }).defaultPrevented).toBe(
      false,
    );
    expect(domSelection(value)).toEqual(selection);
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(onTransaction).not.toHaveBeenCalled();
  });

  it("does not collapse or replace a cross-cell selection", () => {
    const { container, value, onSelectionChange, onTransaction } = renderEditor();
    const selection = { anchor: range(0, 0).anchor, focus: range(0, 1).focus };
    select(container, selection);
    expect(tab(container).defaultPrevented).toBe(false);
    expect(domSelection(value)).toEqual(selection);
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(onTransaction).not.toHaveBeenCalled();
  });

  it("preserves list Tab indentation instead of treating it as cell navigation", () => {
    const value = createDocument([
      createBulletList([
        createListItem([createText("父")]),
        createListItem([createText("子")]),
      ]),
    ]);
    const { container, onTransaction, onCellSelectionChange } = renderEditor({
      defaultValue: value,
    });
    const point = { path: [0, 1, 0], offset: 0 };
    select(container, { anchor: point, focus: point });
    expect(tab(container).defaultPrevented).toBe(true);
    expect(onTransaction).toHaveBeenCalledTimes(1);
    expect(onTransaction.mock.calls[0]?.[0].inputType).toBe("indentListItem");
    expect(onCellSelectionChange).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    "moves a same-cell multi-paragraph range without deleting text (backward: %s)",
    (backward) => {
      const table = createTable(1, 2);
      table.children[0]!.children[0]!.children = [
        createParagraph([createText("开头", { bold: true })]),
        createParagraph([createText("结尾", { italic: true })]),
      ];
      const value = createDocument([table]);
      const { container, onChange, onTransaction } = renderEditor({ value });
      const anchor = { path: [0, 0, 0, 0, 0], offset: 1 };
      const focus = { path: [0, 0, 0, 1, 0], offset: 1 };
      select(
        container,
        backward ? { anchor: focus, focus: anchor } : { anchor, focus },
      );
      expect(tab(container).defaultPrevented).toBe(true);
      expect(domSelection(value)).toEqual(range(0, 1));
      expect(container.querySelector("strong")?.textContent).toBe("开头");
      expect(container.querySelector("em")?.textContent).toBe("结尾");
      expect(onChange).not.toHaveBeenCalled();
      expect(onTransaction).not.toHaveBeenCalled();
    },
  );

  it("keeps controlled selection, cell highlight and repeated navigation synchronized", () => {
    const value = createDocument([createTable(2, 2)]);
    const calls = vi.fn();
    const changes = vi.fn();
    function ControlledEditor() {
      const [selection, setSelection] = useState(range(0, 0));
      const [cellSelection, setCellSelection] = useState<CellSelection>();
      return createElement(RichTextEditor, {
        contentEditable: true,
        value,
        selection,
        cellSelection,
        onCellSelectionChange: setCellSelection,
        onSelectionChange: (next) => {
          calls(next);
          setSelection(next);
        },
        onChange: changes,
        onTransaction: changes,
      });
    }
    const { container, root } = renderEditor();
    act(() => root.render(createElement(ControlledEditor)));
    expect(tab(container).defaultPrevented).toBe(true);
    expect(tab(container).defaultPrevented).toBe(true);
    expect(domSelection(value)).toEqual(range(1, 0));
    expect(
      container
        .querySelector('td[data-selected="true"]')
        ?.getAttribute("data-crucialy-path"),
    ).toBe("[0,1,0]");
    expect(calls).toHaveBeenCalledTimes(2);
    expect(changes).not.toHaveBeenCalled();
  });

  it("does not depend on a document mutation command registry", () => {
    const { container, value, onTransaction } = renderEditor({
      commandRegistry: createCommandRegistry(),
    });
    select(container, range(0, 0));
    expect(tab(container).defaultPrevented).toBe(true);
    expect(domSelection(value)).toEqual(range(0, 1));
    expect(onTransaction).not.toHaveBeenCalled();
  });

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
