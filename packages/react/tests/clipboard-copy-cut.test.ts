// @vitest-environment jsdom

import {
  createDocument,
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
