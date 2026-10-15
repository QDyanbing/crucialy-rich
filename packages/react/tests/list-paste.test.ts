// @vitest-environment jsdom

import {
  createBulletList,
  createDocument,
  createListItem,
  createOrderedList,
  createTaskItem,
  createTaskList,
  createText,
  type ListNode,
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

function renderList(list: ListNode, onPaste?: RichTextEditorProps["onPaste"]) {
  const container = document.createElement("div");
  const root = createRoot(container);
  const onTransaction = vi.fn();
  const value = createDocument([list]);
  roots.push(root);
  document.body.append(container);
  act(() => {
    root.render(
      createElement(RichTextEditor, {
        contentEditable: true,
        defaultValue: value,
        onTransaction,
        ...(onPaste ? { onPaste } : {}),
      }),
    );
  });
  const text = container.querySelector('[data-crucialy-path="[0,0,0]"]')?.firstChild;
  const selection = window.getSelection();
  if (!text || !selection) {
    throw new Error("Missing list paste text target.");
  }
  const range = document.createRange();
  range.setStart(text, 1);
  range.setEnd(text, 2);
  selection.removeAllRanges();
  selection.addRange(range);
  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", {
    value: {
      types: ["text/plain"],
      getData: (type: string) => (type === "text/plain" ? "甲\n\n乙" : ""),
    },
  });
  act(() => {
    container.firstElementChild?.dispatchEvent(event);
  });
  return { container, event, onTransaction, value };
}

describe("RichTextEditor native list paste", () => {
  it.each([
    createBulletList([
      createListItem([createText("开旧尾")]),
      createListItem([createText("邻项")]),
    ]),
    createOrderedList(
      [createListItem([createText("开旧尾")]), createListItem([createText("邻项")])],
      7,
    ),
    createTaskList([
      createTaskItem([createText("开旧尾")], true),
      createTaskItem([createText("邻项")], true),
    ]),
  ])("pastes lines into $type while keeping its semantics", (list) => {
    const { container, event, onTransaction, value } = renderList(list);
    expect(event.defaultPrevented).toBe(true);
    expect(
      Array.from(container.querySelectorAll("li"), (item) => item.textContent),
    ).toEqual(["开甲", "", "乙尾", "邻项"]);
    expect(onTransaction).toHaveBeenCalledTimes(1);
    expect(onTransaction.mock.calls[0]?.[0]).toMatchObject({
      before: value,
      inputType: "insertFromPaste",
      beforeSelection: {
        anchor: { path: [0, 0, 0], offset: 1 },
        focus: { path: [0, 0, 0], offset: 2 },
      },
      selection: {
        anchor: { path: [0, 2, 0], offset: 1 },
        focus: { path: [0, 2, 0], offset: 1 },
      },
      transaction: {
        operations: [
          { type: "delete_text" },
          { type: "insert_text", text: "甲" },
          { type: "split_list_item" },
          { type: "insert_text", text: "" },
          { type: "split_list_item" },
          { type: "insert_text", text: "乙" },
        ],
      },
    });
    if (list.type === "orderedList") {
      expect(container.querySelector("ol")?.getAttribute("start")).toBe("7");
    }
    if (list.type === "taskList") {
      expect(
        Array.from(
          container.querySelectorAll('input[type="checkbox"]'),
          (input) => (input as HTMLInputElement).checked,
        ),
      ).toEqual([true, false, false, true]);
    }
  });

  it("lets the host prevent paste before executing the list command", () => {
    const onPaste = vi.fn<NonNullable<RichTextEditorProps["onPaste"]>>((event) =>
      event.preventDefault(),
    );
    const { container, event, onTransaction } = renderList(
      createBulletList([createListItem([createText("开旧尾")])]),
      onPaste,
    );
    expect(onPaste).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
    expect(onTransaction).not.toHaveBeenCalled();
    expect(container.querySelector("li")?.textContent).toBe("开旧尾");
  });
});
