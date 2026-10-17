// @vitest-environment jsdom

import {
  createDocument,
  createCommandRegistry,
  createBulletList,
  createListItem,
  createOrderedList,
  createTaskItem,
  createTaskList,
  pasteCommand,
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
  it("respects a registry that accepts HTML but declines Markdown", () => {
    const commandRegistry = createCommandRegistry([
      {
        ...pasteCommand,
        canExecute: ({ payload }) =>
          (payload as { fragment: { mimeType: string } }).fragment.mimeType ===
          "text/html",
      },
    ]);
    const { container, onTransaction } = renderEditor(
      createDocument([createParagraph([createText("开旧尾")])]),
      { commandRegistry },
    );
    selectText(container, "[0,0]", 1, 2);
    paste(container, {
      "text/markdown": "# MD",
      "text/html": "<p><strong>HTML</strong></p>",
      "text/plain": "纯",
    });
    expect(container.querySelector("strong")?.textContent).toBe("HTML");
    expect(container.querySelector("h1")).toBeNull();
    expect(onTransaction).toHaveBeenCalledTimes(1);
  });

  it("does not execute a paste command disabled for every candidate", () => {
    const canExecute = vi.fn(() => false);
    const execute = vi.fn(pasteCommand.execute);
    const { container, onTransaction } = renderEditor(cellDocument(), {
      commandRegistry: createCommandRegistry([
        { ...pasteCommand, canExecute, execute },
      ]),
    });
    selectText(container, "[0,0,0,0,0]", 1);
    expect(
      paste(container, {
        "text/markdown": "MD",
        "text/html": "<p>HTML</p>",
        "text/plain": "纯",
      }).defaultPrevented,
    ).toBe(true);
    expect(canExecute).toHaveBeenCalledTimes(3);
    expect(execute).not.toHaveBeenCalled();
    expect(onTransaction).not.toHaveBeenCalled();
  });

  it("blocks clipboard writes when the registry has no paste command", () => {
    const { container, onTransaction } = renderEditor(cellDocument(), {
      commandRegistry: createCommandRegistry(),
    });
    selectText(container, "[0,0,0,0,0]", 1);
    expect(paste(container, { "text/plain": "不可插入" }).defaultPrevented).toBe(true);
    expect(onTransaction).not.toHaveBeenCalled();
  });

  it("does not retry another format after command execution fails", () => {
    const execute = vi.fn(() => {
      throw new Error("Host command failure.");
    });
    const { container, onTransaction } = renderEditor(cellDocument(), {
      commandRegistry: createCommandRegistry([
        { ...pasteCommand, canExecute: () => true, execute },
      ]),
    });
    selectText(container, "[0,0,0,0,0]", 1);
    expect(
      paste(container, { "text/html": "<p>HTML</p>", "text/plain": "纯" })
        .defaultPrevented,
    ).toBe(true);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(container.querySelector("td")?.textContent).toBe("开旧尾");
    expect(onTransaction).not.toHaveBeenCalled();
  });

  it("leaves readonly paste to the host without querying commands", () => {
    const canExecute = vi.fn(() => true);
    const { container, onTransaction } = renderEditor(cellDocument(), {
      contentEditable: false,
      commandRegistry: createCommandRegistry([{ ...pasteCommand, canExecute }]),
    });
    selectText(container, "[0,0,0,0,0]", 1);
    expect(paste(container, { "text/plain": "纯" }).defaultPrevented).toBe(false);
    expect(canExecute).not.toHaveBeenCalled();
    expect(onTransaction).not.toHaveBeenCalled();
  });

  it("honors the host onPaste cancellation before querying candidates", () => {
    const canExecute = vi.fn(() => true);
    const { container, onTransaction } = renderEditor(cellDocument(), {
      onPaste: (event) => event.preventDefault(),
      commandRegistry: createCommandRegistry([{ ...pasteCommand, canExecute }]),
    });
    selectText(container, "[0,0,0,0,0]", 1);
    expect(
      paste(container, { "text/html": "<p>HTML</p>", "text/plain": "纯" })
        .defaultPrevented,
    ).toBe(true);
    expect(canExecute).not.toHaveBeenCalled();
    expect(onTransaction).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: "ordered",
      list: createOrderedList([createListItem([createText("开旧尾")])], 4),
      path: [0, 0, 0],
    },
    {
      name: "task",
      list: createTaskList([createTaskItem([createText("开旧尾")], true)]),
      path: [0, 0, 0],
    },
    {
      name: "nested",
      list: createBulletList([
        createListItem(
          [createText("父项")],
          createBulletList([createListItem([createText("开旧尾")])]),
        ),
      ]),
      path: [0, 0, 1, 0, 0],
    },
  ])("falls back from Markdown and HTML inside a $name item", ({ list, path }) => {
    const { container, onTransaction } = renderEditor(createDocument([list]));
    selectText(container, JSON.stringify(path), 1, 2);
    const event = paste(container, {
      "text/markdown": "# 富文本",
      "text/html": "<b>富文本</b>",
      "text/plain": "甲\n乙",
    });
    const listPath = JSON.stringify(path.slice(0, -2));
    expect(event.defaultPrevented).toBe(true);
    expect(
      Array.from(
        container.querySelectorAll(`[data-crucialy-path="${listPath}"] > li`),
        (item) => item.textContent,
      ),
    ).toEqual(["开甲", "乙尾"]);
    expect(onTransaction).toHaveBeenCalledTimes(1);
    expect(onTransaction.mock.calls[0]?.[0]).toMatchObject({
      selection: { anchor: { path: [...path.slice(0, -2), 1, 0], offset: 1 } },
      transaction: {
        operations: [
          { type: "delete_text" },
          { type: "insert_text", text: "甲" },
          { type: "split_list_item" },
          { type: "insert_text", text: "乙" },
        ],
      },
    });
    if (list.type === "orderedList") {
      expect(container.querySelector("ol")?.getAttribute("start")).toBe("4");
    }
    if (list.type === "taskList") {
      expect(
        Array.from(container.querySelectorAll("input"), (input) => input.checked),
      ).toEqual([true, false]);
    }
  });

  it("blocks a rich-only cell paste without guessing a plain-text replacement", () => {
    const { container, onTransaction } = renderEditor(cellDocument());
    selectText(container, "[0,0,0,0,0]", 1, 2);
    const event = paste(container, { "text/html": "<b>不可插入</b>" });
    expect(event.defaultPrevented).toBe(true);
    expect(container.querySelector("td")?.textContent).toBe("开旧尾");
    expect(onTransaction).not.toHaveBeenCalled();
  });

  it("blocks an empty or unsupported clipboard without changing the model", () => {
    const { container, onTransaction } = renderEditor(cellDocument());
    selectText(container, "[0,0,0,0,0]", 1);
    expect(paste(container, {}).defaultPrevented).toBe(true);
    expect(paste(container, { "image/png": "binary" }).defaultPrevented).toBe(true);
    expect(container.querySelector("td")?.textContent).toBe("开旧尾");
    expect(onTransaction).not.toHaveBeenCalled();
  });

  it("blocks paste when the browser selection is outside the editor", () => {
    const { container, onTransaction } = renderEditor(cellDocument());
    const outside = document.createTextNode("外部文字");
    document.body.append(outside);
    const range = document.createRange();
    range.setStart(outside, 1);
    range.collapse(true);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    expect(paste(container, { "text/plain": "不可插入" }).defaultPrevented).toBe(true);
    expect(onTransaction).not.toHaveBeenCalled();
  });

  it("blocks paste during composition without submitting candidate text", () => {
    const { container, onTransaction } = renderEditor(cellDocument());
    selectText(container, "[0,0,0,0,0]", 1);
    act(() => {
      container.firstElementChild?.dispatchEvent(
        new CompositionEvent("compositionstart", { bubbles: true }),
      );
    });
    expect(paste(container, { "text/plain": "不可插入" }).defaultPrevented).toBe(true);
    expect(container.querySelector("td")?.textContent).toBe("开旧尾");
    expect(onTransaction).not.toHaveBeenCalled();
  });

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
