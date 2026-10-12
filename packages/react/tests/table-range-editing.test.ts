// @vitest-environment jsdom

import {
  createDocument,
  createParagraph,
  createTableCell,
  createTableRow,
  createText,
} from "@crucialy-rich/core";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RichTextEditor } from "../src";

// React 18 uses textInput in Chromium; jsdom otherwise selects its legacy fallback.
vi.hoisted(() => {
  Object.defineProperty(window, "TextEvent", {
    configurable: true,
    value: InputEvent,
  });
});

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const roots: ReturnType<typeof createRoot>[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) {
    act(() => root.unmount());
  }
  document.body.replaceChildren();
});

function renderTable() {
  const container = document.createElement("div");
  const onTransaction = vi.fn();
  const root = createRoot(container);
  const value = createDocument([
    {
      children: [
        createTableRow([
          createTableCell([
            createParagraph([createText("开头")]),
            createParagraph([createText("中间")]),
            createParagraph([createText("结尾")]),
          ]),
          createTableCell([createParagraph([createText("邻格")])]),
        ]),
      ],
      type: "table",
    },
  ]);
  roots.push(root);
  document.body.append(container);
  act(() => {
    root.render(
      createElement(RichTextEditor, {
        contentEditable: true,
        defaultValue: value,
        onTransaction,
      }),
    );
  });
  const editor = container.firstElementChild;
  if (!(editor instanceof HTMLElement)) {
    throw new Error("Missing editor root.");
  }
  return { container, editor, onTransaction, value };
}

function selectRange(container: HTMLElement, endPath = "[0,0,0,2,0]") {
  const start = container.querySelector(
    '[data-crucialy-path="[0,0,0,0,0]"]',
  )?.firstChild;
  const end = container.querySelector(`[data-crucialy-path="${endPath}"]`)?.firstChild;
  const selection = window.getSelection();
  if (!start || !end || !selection) {
    throw new Error("Missing cell range text nodes.");
  }
  const range = document.createRange();
  range.setStart(start, 1);
  range.setEnd(end, 1);
  selection.removeAllRanges();
  selection.addRange(range);
}

describe("RichTextEditor table range editing", () => {
  it.each([
    { key: "Backspace", inputType: "deleteBackward", operations: ["delete_range"] },
    { key: "Delete", inputType: "deleteForward", operations: ["delete_range"] },
    {
      key: "Enter",
      inputType: "insertParagraph",
      operations: ["delete_range", "split_block"],
    },
  ])("handles $key across cell paragraphs", ({ key, inputType, operations }) => {
    const { container, editor, onTransaction, value } = renderTable();
    selectRange(container);
    const event = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key,
    });
    act(() => {
      editor.dispatchEvent(event);
    });

    expect(event.defaultPrevented).toBe(true);
    expect(onTransaction).toHaveBeenCalledTimes(1);
    const change = onTransaction.mock.calls[0]?.[0];
    expect(change.inputType).toBe(inputType);
    expect(change.before).toEqual(value);
    expect(change.beforeSelection).toEqual({
      anchor: { path: [0, 0, 0, 0, 0], offset: 1 },
      focus: { path: [0, 0, 0, 2, 0], offset: 1 },
    });
    expect(
      change.transaction.operations.map(
        (operation: { type: string }) => operation.type,
      ),
    ).toEqual(operations);
    expect(
      [...container.querySelectorAll("td:first-child p")].map((p) => p.textContent),
    ).toEqual(key === "Enter" ? ["开", "尾"] : ["开尾"]);
    expect(change.selection.anchor).toEqual({
      path: [0, 0, 0, key === "Enter" ? 1 : 0, 0],
      offset: key === "Enter" ? 0 : 1,
    });
    expect(container.querySelector("td:last-child")?.textContent).toBe("邻格");
  });

  it("replaces the range through React beforeinput from textInput", () => {
    const { container, editor, onTransaction } = renderTable();
    selectRange(container);
    const event = new InputEvent("textInput", {
      bubbles: true,
      cancelable: true,
      data: "新",
      inputType: "insertText",
    });
    act(() => {
      editor.dispatchEvent(event);
    });

    expect(event.defaultPrevented).toBe(true);
    expect(onTransaction).toHaveBeenCalledTimes(1);
    expect(container.querySelector("td:first-child")?.textContent).toBe("开新尾");
    expect(onTransaction.mock.calls[0]?.[0]).toMatchObject({
      inputType: "insertText",
      selection: {
        anchor: { path: [0, 0, 0, 0, 0], offset: 2 },
        focus: { path: [0, 0, 0, 0, 0], offset: 2 },
      },
      transaction: {
        operations: [{ type: "delete_range" }, { type: "insert_text", text: "新" }],
      },
    });
  });

  it("commits composition once against the original multi-paragraph range", () => {
    const { container, editor, onTransaction } = renderTable();
    selectRange(container);
    act(() => {
      editor.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
      editor.dispatchEvent(
        new CompositionEvent("compositionupdate", { bubbles: true, data: "中文" }),
      );
    });
    expect(onTransaction).not.toHaveBeenCalled();
    act(() => {
      editor.dispatchEvent(
        new CompositionEvent("compositionend", { bubbles: true, data: "中文" }),
      );
    });

    expect(onTransaction).toHaveBeenCalledTimes(1);
    expect(container.querySelector("td:first-child")?.textContent).toBe("开中文尾");
    expect(onTransaction.mock.calls[0]?.[0]).toMatchObject({
      batch: "composition",
      inputType: "insertCompositionText",
      selection: { anchor: { path: [0, 0, 0, 0, 0], offset: 3 } },
      transaction: {
        operations: [{ type: "delete_range" }, { type: "insert_text", text: "中文" }],
      },
    });
  });

  it("does not emit a range deletion transaction across cells", () => {
    const { container, editor, onTransaction } = renderTable();
    selectRange(container, "[0,0,1,0,0]");
    act(() => {
      editor.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "Delete" }),
      );
    });

    expect(onTransaction).not.toHaveBeenCalled();
    expect(container.querySelector("td:first-child")?.textContent).toBe("开头中间结尾");
    expect(container.querySelector("td:last-child")?.textContent).toBe("邻格");
  });
});
