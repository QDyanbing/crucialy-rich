// @vitest-environment jsdom

import {
  createDocument,
  createParagraph,
  createTable,
  createText,
  type DocumentNode,
} from "@crucialy-rich/core";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RichTextEditor, type RichTextEditorProps } from "../src";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const roots: ReturnType<typeof createRoot>[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) {
    act(() => root.unmount());
  }
  document.body.replaceChildren();
});

function renderEditor(value: DocumentNode, props: Partial<RichTextEditorProps> = {}) {
  const container = document.createElement("div");
  const root = createRoot(container);
  const onTransaction = vi.fn();
  roots.push(root);
  document.body.append(container);
  act(() => {
    root.render(
      createElement(RichTextEditor, {
        contentEditable: true,
        defaultValue: value,
        ...props,
        onTransaction,
      }),
    );
  });
  return { container, onTransaction };
}

function selectText(container: HTMLElement, path: string, start: number, end = start) {
  const text = container.querySelector(`[data-crucialy-path="${path}"]`)?.firstChild;
  const selection = window.getSelection();
  if (!text || !selection) {
    throw new Error("Missing clipboard target.");
  }
  const range = document.createRange();
  range.setStart(text, start);
  range.setEnd(text, end);
  selection.removeAllRanges();
  selection.addRange(range);
}

function paste(container: HTMLElement, data: Record<string, string>) {
  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", {
    value: { types: Object.keys(data), getData: (type: string) => data[type] ?? "" },
  });
  act(() => {
    container.firstElementChild?.dispatchEvent(event);
  });
  return event;
}

function cellDocument() {
  const table = createTable(2, 2);
  table.children[0]!.children[0]!.children = [createParagraph([createText("开旧尾")])];
  table.children[0]!.children[1]!.children = [createParagraph([createText("邻格")])];
  return createDocument([table]);
}

describe("RichTextEditor clipboard format fallback", () => {
  it("uses the supplied plain text when a cell cannot accept HTML", () => {
    const { container, onTransaction } = renderEditor(cellDocument());
    selectText(container, "[0,0,0,0,0]", 1, 2);
    const event = paste(container, {
      "text/html": "<b>富文本</b>",
      "text/plain": "纯",
    });
    expect(event.defaultPrevented).toBe(true);
    expect(container.querySelector("td")?.textContent).toBe("开纯尾");
    expect(container.querySelectorAll("td")[1]?.textContent).toBe("邻格");
    expect(container.querySelector("b, strong")).toBeNull();
    expect(onTransaction).toHaveBeenCalledTimes(1);
    expect(onTransaction.mock.calls[0]?.[0]).toMatchObject({
      inputType: "insertFromPaste",
      transaction: {
        operations: [{ type: "delete_text" }, { type: "insert_text", text: "纯" }],
      },
      selection: { anchor: { path: [0, 0, 0, 0, 0], offset: 2 } },
    });
  });
});
