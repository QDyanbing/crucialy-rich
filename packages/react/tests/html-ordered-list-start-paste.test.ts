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
    throw new Error("Missing rendered ordered list start paste selection target.");
  }

  const range = document.createRange();
  range.setStart(text, offset);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

describe("RichTextEditor HTML ordered list start paste", () => {
  it("preserves ordered numbering from native HTML clipboard data", () => {
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
            ? "<ol start=4><li>第四项</li><li>第五项</li></ol>"
            : "第四项\n第五项",
        types: ["text/html", "text/plain"],
      },
    });

    act(() => {
      editor?.dispatchEvent(event);
    });

    const orderedList = container.querySelector("ol");

    expect(event.defaultPrevented).toBe(true);
    expect(orderedList?.getAttribute("start")).toBe("4");
    expect(
      Array.from(orderedList?.querySelectorAll(":scope > li") ?? []).map(
        (item) => item.textContent,
      ),
    ).toEqual(["第四项", "第五项"]);
    expect(handleTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ inputType: "insertFromPaste" }),
    );
  });
});
