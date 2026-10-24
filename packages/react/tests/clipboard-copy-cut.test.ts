// @vitest-environment jsdom

import {
  createDocument,
  createCommandRegistry,
  createCommandSuccess,
  createTable,
  createTransaction,
  deleteSelectionCommand,
  createParagraph,
  createText,
  type RangeSelection,
} from "@crucialy-rich/core";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RichTextEditor, type RichTextEditorProps } from "../src";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const roots: ReturnType<typeof createRoot>[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) act(() => root.unmount());
  document.body.replaceChildren();
});

function renderEditor(
  value = createDocument([createParagraph([createText("前甲乙后")])]),
  props: Partial<RichTextEditorProps> = {},
) {
  const container = document.createElement("div");
  const root = createRoot(container);
  const onChange = vi.fn();
  const onSelectionChange = vi.fn();
  const onTransaction = vi.fn();
  roots.push(root);
  document.body.append(container);
  act(() =>
    root.render(
      createElement(RichTextEditor, {
        defaultValue: value,
        contentEditable: true,
        onChange,
        onSelectionChange,
        onTransaction,
        ...props,
      }),
    ),
  );
  return { container, value, root, onChange, onSelectionChange, onTransaction };
}

function select(
  container: HTMLElement,
  selection: RangeSelection = {
    anchor: { path: [0, 0], offset: 1 },
    focus: { path: [0, 0], offset: 3 },
  },
) {
  function text(path: number[]) {
    return container.querySelector(`[data-crucialy-path="${JSON.stringify(path)}"]`)!
      .firstChild!;
  }
  window
    .getSelection()!
    .setBaseAndExtent(
      text(selection.anchor.path),
      selection.anchor.offset,
      text(selection.focus.path),
      selection.focus.offset,
    );
}

function clipboard(container: HTMLElement, type: "copy" | "cut", fail = false) {
  const data: Record<string, string> = {};
  const setData = vi.fn((mime: string, text: string) => {
    if (fail) throw new Error("Clipboard is unavailable.");
    data[mime] = text;
  });
  const clearData = vi.fn(() => {
    for (const key of Object.keys(data)) delete data[key];
  });
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", { value: { setData, clearData } });
  act(() => container.firstElementChild!.dispatchEvent(event));
  return { event, data, setData, clearData };
}

describe("RichTextEditor plain clipboard copy", () => {
  it("supports readonly controlled values without using a command registry", () => {
    const value = createDocument([createParagraph([createText("前甲乙后")])]);
    const host = renderEditor(value, { value, contentEditable: false });
    select(host.container);
    expect(clipboard(host.container, "copy").data).toEqual({ "text/plain": "甲乙" });
    expect(host.onTransaction).not.toHaveBeenCalled();
  });

  it("lets the host cancel and completely own clipboard contents", () => {
    const onCopy = vi.fn((event) => {
      event.clipboardData.setData("text/html", "<b>宿主</b>");
      event.preventDefault();
    });
    const host = renderEditor(undefined, { onCopy });
    select(host.container);
    const result = clipboard(host.container, "copy");
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(result.data).toEqual({ "text/html": "<b>宿主</b>" });
    expect(result.clearData).not.toHaveBeenCalled();
  });

  it("does not read a different editor or a range partly outside its root", () => {
    const first = renderEditor();
    const second = renderEditor();
    select(second.container);
    expect(clipboard(first.container, "copy").setData).not.toHaveBeenCalled();
    const start =
      first.container.querySelector("p span")?.firstChild ??
      first.container.querySelector('[data-crucialy-path="[0,0]"]')!.firstChild!;
    const end = second.container.querySelector(
      '[data-crucialy-path="[0,0]"]',
    )!.firstChild!;
    window.getSelection()!.setBaseAndExtent(start, 1, end, 3);
    expect(clipboard(first.container, "copy").setData).not.toHaveBeenCalled();
    expect(first.onTransaction).not.toHaveBeenCalled();
  });

  it("reads model text rather than externally modified rendered text", () => {
    const host = renderEditor();
    host.container.querySelector(
      '[data-crucialy-path="[0,0]"]',
    )!.firstChild!.textContent = "前错误后";
    select(host.container);
    expect(clipboard(host.container, "copy").data).toEqual({ "text/plain": "甲乙" });
  });

  it("does not export an unfinished composition", () => {
    const host = renderEditor();
    select(host.container);
    act(() =>
      host.container.firstElementChild!.dispatchEvent(
        new CompositionEvent("compositionstart", { bubbles: true }),
      ),
    );
    expect(clipboard(host.container, "copy").setData).not.toHaveBeenCalled();
    expect(host.onTransaction).not.toHaveBeenCalled();
  });

  it("contains clipboard write failures without changing the model", () => {
    const host = renderEditor();
    select(host.container);
    const result = clipboard(host.container, "copy", true);
    expect(result.event.defaultPrevented).toBe(true);
    expect(result.data).toEqual({});
    expect(host.onChange).not.toHaveBeenCalled();
    expect(host.onTransaction).not.toHaveBeenCalled();
  });

  it("copies model text without changing the document or publishing a transaction", () => {
    const host = renderEditor();
    select(host.container);
    const { event, data } = clipboard(host.container, "copy");
    expect(event.defaultPrevented).toBe(true);
    expect(data).toEqual({ "text/plain": "甲乙" });
    expect(host.container.textContent).toBe("前甲乙后");
    expect(host.onChange).not.toHaveBeenCalled();
    expect(host.onSelectionChange).not.toHaveBeenCalled();
    expect(host.onTransaction).not.toHaveBeenCalled();
  });

  it("reads backward selections and does not emit rich HTML", () => {
    const host = renderEditor(
      createDocument([
        createParagraph([
          createText("甲", { bold: true }),
          createText("乙", { italic: true }),
        ]),
      ]),
    );
    select(host.container, {
      anchor: { path: [0, 1], offset: 1 },
      focus: { path: [0, 0], offset: 0 },
    });
    expect(clipboard(host.container, "copy").data).toEqual({ "text/plain": "甲乙" });
  });

  it("keeps collapsed selections on the browser default path", () => {
    const host = renderEditor();
    select(host.container, {
      anchor: { path: [0, 0], offset: 1 },
      focus: { path: [0, 0], offset: 1 },
    });
    const result = clipboard(host.container, "copy");
    expect(result.event.defaultPrevented).toBe(false);
    expect(result.setData).not.toHaveBeenCalled();
  });
});

describe("RichTextEditor plain clipboard cut", () => {
  it("does not delete when writing to the clipboard fails", () => {
    const host = renderEditor();
    select(host.container);
    const result = clipboard(host.container, "cut", true);
    expect(result.event.defaultPrevented).toBe(true);
    expect(result.data).toEqual({});
    expect(host.container.textContent).toBe("前甲乙后");
    expect(host.onChange).not.toHaveBeenCalled();
    expect(host.onTransaction).not.toHaveBeenCalled();
  });

  it.each(["missing", "disabled", "throw", "empty"])(
    "does not write or mutate for a %s deletion command",
    (mode) => {
      const commandRegistry = createCommandRegistry(
        mode === "missing"
          ? []
          : [
              {
                ...deleteSelectionCommand,
                canExecute: () => mode !== "disabled",
                execute: () => {
                  if (mode === "throw") throw new Error("Host deletion failed.");
                  return createCommandSuccess(deleteSelectionCommand.name, {
                    transaction: createTransaction(),
                    selection: {
                      anchor: { path: [0, 0], offset: 1 },
                      focus: { path: [0, 0], offset: 1 },
                    },
                  });
                },
              },
            ],
      );
      const host = renderEditor(undefined, { commandRegistry });
      select(host.container);
      const result = clipboard(host.container, "cut");
      expect(result.event.defaultPrevented).toBe(true);
      expect(result.setData).not.toHaveBeenCalled();
      expect(host.container.textContent).toBe("前甲乙后");
      expect(host.onTransaction).not.toHaveBeenCalled();
    },
  );

  it("lets a host cut handler own the event before the registry runs", () => {
    const execute = vi.fn(deleteSelectionCommand.execute);
    const onCut = vi.fn((event) => event.preventDefault());
    const host = renderEditor(undefined, {
      commandRegistry: createCommandRegistry([{ ...deleteSelectionCommand, execute }]),
      onCut,
    });
    select(host.container);
    expect(clipboard(host.container, "cut").setData).not.toHaveBeenCalled();
    expect(onCut).toHaveBeenCalledTimes(1);
    expect(execute).not.toHaveBeenCalled();
  });

  it("does not turn readonly cut into an edit", () => {
    const host = renderEditor(undefined, { contentEditable: false });
    select(host.container);
    const result = clipboard(host.container, "cut");
    expect(result.event.defaultPrevented).toBe(false);
    expect(result.setData).not.toHaveBeenCalled();
    expect(host.onTransaction).not.toHaveBeenCalled();
  });

  it("blocks native cut during composition without deleting or exporting preedit text", () => {
    const host = renderEditor();
    select(host.container);
    act(() =>
      host.container.firstElementChild!.dispatchEvent(
        new CompositionEvent("compositionstart", { bubbles: true }),
      ),
    );
    const result = clipboard(host.container, "cut");
    expect(result.event.defaultPrevented).toBe(true);
    expect(result.setData).not.toHaveBeenCalled();
    expect(host.onChange).not.toHaveBeenCalled();
  });

  it("does not use another editor's selection for cut", () => {
    const first = renderEditor();
    const second = renderEditor();
    select(second.container);
    const result = clipboard(first.container, "cut");
    expect(result.event.defaultPrevented).toBe(true);
    expect(result.setData).not.toHaveBeenCalled();
    expect(first.onTransaction).not.toHaveBeenCalled();
    expect(second.onTransaction).not.toHaveBeenCalled();
  });

  it("copies cross-cell text but refuses to cut the unsupported structural range", () => {
    const table = createTable(1, 2);
    for (const cell of table.children[0]!.children)
      cell.children = [createParagraph([createText("文字")])];
    const host = renderEditor(createDocument([table]));
    select(host.container, {
      anchor: { path: [0, 0, 0, 0, 0], offset: 1 },
      focus: { path: [0, 0, 1, 0, 0], offset: 1 },
    });
    expect(clipboard(host.container, "copy").data).toEqual({ "text/plain": "字\t文" });
    const result = clipboard(host.container, "cut");
    expect(result.event.defaultPrevented).toBe(true);
    expect(result.setData).not.toHaveBeenCalled();
    expect(host.container.querySelectorAll("td")).toHaveLength(2);
    expect(host.container.textContent).toBe("文字文字");
    expect(host.onChange).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    "cuts through deleteSelection once (backward: %s)",
    (backward) => {
      const host = renderEditor();
      const selection: RangeSelection = {
        anchor: { path: [0, 0], offset: backward ? 3 : 1 },
        focus: { path: [0, 0], offset: backward ? 1 : 3 },
      };
      select(host.container, selection);
      const result = clipboard(host.container, "cut");
      expect(result.event.defaultPrevented).toBe(true);
      expect(result.data).toEqual({ "text/plain": "甲乙" });
      expect(host.container.textContent).toBe("前后");
      expect(host.onChange).toHaveBeenCalledTimes(1);
      expect(host.onTransaction).toHaveBeenCalledTimes(1);
      expect(host.onTransaction.mock.calls[0]?.[0]).toMatchObject({
        inputType: "deleteByCut",
        before: host.value,
        beforeSelection: selection,
        selection: {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [0, 0], offset: 1 },
        },
        transaction: { operations: [{ type: "delete_text" }] },
      });
      expect(host.onTransaction.mock.calls[0]?.[0].batch).toBeUndefined();
    },
  );

  it("emits changes but does not replace a controlled value until the host accepts it", () => {
    const value = createDocument([createParagraph([createText("前甲乙后")])]);
    const host = renderEditor(value, { value });
    select(host.container);
    expect(clipboard(host.container, "cut").data).toEqual({ "text/plain": "甲乙" });
    expect(host.onChange).toHaveBeenCalledTimes(1);
    expect(host.onChange.mock.calls[0]?.[0]).toEqual(
      createDocument([createParagraph([createText("前后")])]),
    );
    expect(host.container.textContent).toBe("前甲乙后");
  });
});

describe("RichTextEditor opt-in HTML clipboard", () => {
  it.each([true, false])(
    "writes both formats without a transaction when editable is %s",
    (contentEditable) => {
      const host = renderEditor(
        createDocument([createParagraph([createText("前甲乙后", { bold: true })])]),
        { clipboardFormat: "html", contentEditable },
      );
      select(host.container);
      expect(clipboard(host.container, "copy").data).toEqual({
        "text/plain": "甲乙",
        "text/html": "<p><strong>甲乙</strong></p>",
      });
      expect(host.onChange).not.toHaveBeenCalled();
      expect(host.onTransaction).not.toHaveBeenCalled();
    },
  );

  it("cuts once after both formats are written", () => {
    const host = renderEditor(
      createDocument([createParagraph([createText("前甲乙后", { italic: true })])]),
      { clipboardFormat: "html" },
    );
    select(host.container);
    expect(clipboard(host.container, "cut").data).toEqual({
      "text/plain": "甲乙",
      "text/html": "<p><em>甲乙</em></p>",
    });
    expect(host.onTransaction).toHaveBeenCalledTimes(1);
    expect(host.onTransaction.mock.calls[0]?.[0].inputType).toBe("deleteByCut");
    expect(host.container.textContent).toBe("前后");
  });
});
