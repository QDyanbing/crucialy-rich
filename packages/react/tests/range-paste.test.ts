// @vitest-environment jsdom

import {
  createDocument,
  createParagraph,
  createTableCell,
  createTableRow,
  createText,
  type DocumentNode,
} from "@crucialy-rich/core";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RichTextEditor } from "../src";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const roots: ReturnType<typeof createRoot>[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) {
    act(() => root.unmount());
  }
  document.body.replaceChildren();
});

function renderEditor(value: DocumentNode, startPath: string, endPath: string) {
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
        onTransaction,
      }),
    );
  });
  const start = container.querySelector(
    `[data-crucialy-path="${startPath}"]`,
  )?.firstChild;
  const end = container.querySelector(`[data-crucialy-path="${endPath}"]`)?.firstChild;
  const selection = window.getSelection();
  if (!start || !end || !selection) {
    throw new Error("Missing range paste text nodes.");
  }
  const range = document.createRange();
  range.setStart(start, 1);
  range.setEnd(end, 1);
  selection.removeAllRanges();
  selection.addRange(range);
  return { container, onTransaction };
}

function dispatchPaste(container: HTMLElement, mimeType: string, data: string) {
  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", {
    value: {
      types: [mimeType],
      getData: (type: string) => (type === mimeType ? data : ""),
    },
  });
  act(() => {
    container.firstElementChild?.dispatchEvent(event);
  });
  return event;
}

describe("RichTextEditor range paste", () => {
  it.each([
    {
      mimeType: "text/plain",
      data: "新\n段",
      texts: ["开新", "段尾"],
      operations: ["delete_range", "insert_text", "split_block", "insert_text"],
    },
    {
      mimeType: "text/html",
      data: "<p><strong>新</strong></p>",
      texts: ["开", "新", "尾"],
      operations: ["delete_range", "split_block", "insert_block"],
    },
    {
      mimeType: "text/markdown",
      data: "# 新",
      texts: ["开", "新", "尾"],
      operations: ["delete_range", "split_block", "insert_block"],
    },
  ])(
    "replaces a top-level range from native $mimeType clipboard data",
    ({ mimeType, data, texts, operations }) => {
      const value = createDocument([
        createParagraph([createText("开头")]),
        createParagraph([createText("结尾")]),
      ]);
      const { container, onTransaction } = renderEditor(value, "[0,0]", "[1,0]");
      const event = dispatchPaste(container, mimeType, data);

      expect(event.defaultPrevented).toBe(true);
      expect(onTransaction).toHaveBeenCalledTimes(1);
      expect(
        Array.from(
          container.firstElementChild?.children ?? [],
          (element) => element.textContent,
        ),
      ).toEqual(texts);
      const change = onTransaction.mock.calls[0]?.[0];
      expect(change.before).toEqual(value);
      expect(change.inputType).toBe("insertFromPaste");
      expect(change.beforeSelection).toEqual({
        anchor: { path: [0, 0], offset: 1 },
        focus: { path: [1, 0], offset: 1 },
      });
      expect(
        change.transaction.operations.map(
          (operation: { type: string }) => operation.type,
        ),
      ).toEqual(operations);
      expect(change.selection.anchor).toEqual({ path: [1, 0], offset: 1 });
      if (mimeType === "text/html") {
        expect(container.querySelector("strong")?.textContent).toBe("新");
      }
      if (mimeType === "text/markdown") {
        expect(container.querySelector("h1")?.textContent).toBe("新");
      }
    },
  );

  it("replaces a cell paragraph range with TSV without filling the grid", () => {
    const cell = (text: string) =>
      createTableCell([createParagraph([createText(text)])]);
    const value = createDocument([
      {
        type: "table",
        children: [
          createTableRow([
            createTableCell([
              createParagraph([createText("开头")]),
              createParagraph([createText("结尾")]),
            ]),
            cell("邻格"),
          ]),
          createTableRow([cell("下格"), cell("下邻格")]),
        ],
      },
    ]);
    const { container, onTransaction } = renderEditor(
      value,
      "[0,0,0,0,0]",
      "[0,0,0,1,0]",
    );
    const event = dispatchPaste(container, "text/plain", "甲\t乙\n丙\t丁");

    expect(event.defaultPrevented).toBe(true);
    expect(onTransaction).toHaveBeenCalledTimes(1);
    expect(
      Array.from(container.querySelectorAll("td:first-child p"))
        .slice(0, 2)
        .map((p) => p.textContent),
    ).toEqual(["开甲\t乙", "丙\t丁尾"]);
    expect(
      Array.from(container.querySelectorAll("td"))
        .slice(1)
        .map((cell) => cell.textContent),
    ).toEqual(["邻格", "下格", "下邻格"]);
    expect(onTransaction.mock.calls[0]?.[0]).toMatchObject({
      inputType: "insertFromPaste",
      before: value,
      selection: { anchor: { path: [0, 0, 0, 1, 0], offset: 3 } },
      transaction: {
        operations: [
          { type: "delete_range" },
          { type: "insert_text", text: "甲\t乙" },
          { type: "split_block" },
          { type: "insert_text", text: "丙\t丁" },
        ],
      },
    });
  });
});
