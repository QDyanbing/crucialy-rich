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
    throw new Error("Missing rendered inline code paste selection target.");
  }

  const range = document.createRange();
  range.setStart(text, offset);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

describe("RichTextEditor inline code paste", () => {
  it.each([
    {
      content: "<p>运行 <code>pnpm test</code></p>",
      mimeType: "text/html",
      types: ["text/html", "text/plain"],
    },
    {
      content: "运行 `pnpm test`",
      mimeType: "text/markdown",
      types: ["text/markdown", "text/html", "text/plain"],
    },
  ])("preserves inline code from native $mimeType clipboard data", (source) => {
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

    placeCaret(container, 1);

    const event = new Event("paste", { bubbles: true, cancelable: true });

    Object.defineProperty(event, "clipboardData", {
      value: {
        getData: (mimeType: string) =>
          mimeType === source.mimeType
            ? source.content
            : mimeType === "text/html"
              ? "<p>HTML 降级内容</p>"
              : "纯文本降级内容",
        types: source.types,
      },
    });

    act(() => {
      container.firstElementChild?.dispatchEvent(event);
    });

    const inlineCode = container.querySelector<HTMLElement>(
      'code[data-crucialy-path="[1,1]"]',
    );

    expect(event.defaultPrevented).toBe(true);
    expect(inlineCode?.textContent).toBe("pnpm test");
    expect(container.textContent).not.toContain("降级内容");
    expect(handleTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ inputType: "insertFromPaste" }),
    );
  });
});
