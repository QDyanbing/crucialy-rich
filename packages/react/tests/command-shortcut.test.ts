// @vitest-environment jsdom

import { createDocument, createParagraph, createText } from "@crucialy-rich/core";
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

function selectRenderedText(container: HTMLElement) {
  const textElement = container.querySelector('[data-crucialy-path="[0,0]"]');
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
});
