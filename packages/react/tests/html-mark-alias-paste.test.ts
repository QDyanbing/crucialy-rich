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

function placeCaret(container: HTMLElement, offset: number) {
  const text = container.querySelector('[data-crucialy-path="[0,0]"]')?.firstChild;
  const selection = window.getSelection();

  if (!text || !selection) {
    throw new Error("Missing rendered mark alias paste selection target.");
  }

  const range = document.createRange();
  range.setStart(text, offset);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

describe("RichTextEditor HTML mark alias paste", () => {
  it("preserves nested mark aliases from native HTML clipboard data", () => {
    const container = document.createElement("div");
    const handleTransaction = vi.fn();
    const root = createRoot(container);

    roots.push(root);
    document.body.append(container);

    act(() => {
      root.render(
        createElement(RichTextEditor, {
          contentEditable: true,
          defaultValue: createDocument([createParagraph([createText("前后")])]),
          onTransaction: handleTransaction,
        }),
      );
    });

    const editor = container.firstElementChild;

    placeCaret(container, 1);

    const event = new Event("paste", { bubbles: true, cancelable: true });

    Object.defineProperty(event, "clipboardData", {
      value: {
        getData: (mimeType: string) =>
          mimeType === "text/html"
            ? "<p><b><i><u><del>组合样式</del></u></i></b></p>"
            : "组合样式",
        types: ["text/html", "text/plain"],
      },
    });

    act(() => {
      editor?.dispatchEvent(event);
    });

    const markedText = container.querySelector<HTMLElement>("strong");

    expect(event.defaultPrevented).toBe(true);
    expect(markedText?.textContent).toBe("组合样式");
    expect(markedText?.style.fontStyle).toBe("italic");
    expect(markedText?.style.textDecoration).toBe("underline line-through");
    expect(handleTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ inputType: "insertFromPaste" }),
    );
  });
});
