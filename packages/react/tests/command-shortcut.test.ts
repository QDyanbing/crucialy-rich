// @vitest-environment jsdom

import {
  createDocument,
  createListItem,
  createOrderedList,
  createParagraph,
  createTableCell,
  createTableRow,
  createText,
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

function selectRenderedText(container: HTMLElement, path = "[0,0]") {
  const textElement = container.querySelector(`[data-crucialy-path="${path}"]`);
  const text = textElement?.firstChild;
  const selection = window.getSelection();

  if (!text || !selection) {
    throw new Error("Missing rendered shortcut selection target.");
  }

  const range = document.createRange();
  range.selectNodeContents(text);
  selection.removeAllRanges();
  selection.addRange(range);
}

describe("RichTextEditor command shortcuts", () => {
  it("forwards heading shortcut payloads", () => {
    const container = document.createElement("div");
    const handleTransaction = vi.fn();
    const root = createRoot(container);

    roots.push(root);
    document.body.append(container);

    act(() => {
      root.render(
        createElement(RichTextEditor, {
          contentEditable: true,
          defaultValue: createDocument([createParagraph([createText("快捷键标题")])]),
          onTransaction: handleTransaction,
        }),
      );
    });

    const editor = container.firstElementChild;
    selectRenderedText(container);

    act(() => {
      editor?.dispatchEvent(
        new KeyboardEvent("keydown", {
          altKey: true,
          bubbles: true,
          code: "Digit2",
          ctrlKey: true,
          key: "2",
        }),
      );
    });

    expect(container.querySelector("h2")?.textContent).toBe("快捷键标题");
    expect(handleTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ inputType: "formatShortcut" }),
    );
  });

  it("executes mark shortcuts without a payload", () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    roots.push(root);
    document.body.append(container);

    act(() => {
      root.render(
        createElement(RichTextEditor, {
          contentEditable: true,
          defaultValue: createDocument([createParagraph([createText("删除线")])]),
        }),
      );
    });

    const editor = container.firstElementChild;
    selectRenderedText(container);

    act(() => {
      editor?.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          ctrlKey: true,
          key: "x",
          shiftKey: true,
        }),
      );
    });

    expect(container.querySelector("s")?.textContent).toBe("删除线");
  });

  it("executes mark shortcuts inside list items", () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    roots.push(root);
    document.body.append(container);

    act(() => {
      root.render(
        createElement(RichTextEditor, {
          contentEditable: true,
          defaultValue: createDocument([
            createOrderedList([createListItem([createText("列表快捷键")])]),
          ]),
        }),
      );
    });

    const editor = container.firstElementChild;
    selectRenderedText(container, "[0,0,0]");

    act(() => {
      editor?.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          ctrlKey: true,
          key: "b",
        }),
      );
    });

    expect(container.querySelector("ol li strong")?.textContent).toBe("列表快捷键");
  });

  it("executes mark shortcuts inside table paragraphs", () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    roots.push(root);
    document.body.append(container);

    act(() => {
      root.render(
        createElement(RichTextEditor, {
          contentEditable: true,
          defaultValue: createDocument([
            {
              children: [
                createTableRow([
                  createTableCell([createParagraph([createText("表格快捷键")])]),
                ]),
              ],
              type: "table",
            },
          ]),
        }),
      );
    });

    const editor = container.firstElementChild;
    selectRenderedText(container, "[0,0,0,0,0]");

    act(() => {
      editor?.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          ctrlKey: true,
          key: "i",
        }),
      );
    });

    expect(container.querySelector("td em")?.textContent).toBe("表格快捷键");
  });
});
