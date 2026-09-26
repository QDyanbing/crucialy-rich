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
    throw new Error("Missing rendered paste selection target.");
  }

  const range = document.createRange();
  range.setStart(text, offset);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

describe("RichTextEditor HTML table paste", () => {
  it("handles native HTML clipboard data through the paste command", () => {
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
            ? "<table><tr><td>姓名</td><td>角色</td></tr><tr><td>小明</td><td>开发</td></tr></table>"
            : "姓名\t角色\n小明\t开发",
        types: ["text/html", "text/plain"],
      },
    });

    act(() => {
      editor?.dispatchEvent(event);
    });

    expect(event.defaultPrevented).toBe(true);
    expect(
      Array.from(container.querySelectorAll("td"), (cell) => cell.textContent),
    ).toEqual(["姓名", "角色", "小明", "开发"]);
    expect(handleTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ inputType: "insertFromPaste" }),
    );
  });
});
