// @vitest-environment jsdom

import {
  createCodeBlock,
  createDocument,
  createParagraph,
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

function renderCode(texts: string[]) {
  const container = document.createElement("div");
  const root = createRoot(container);
  const onTransaction = vi.fn();
  const value = createDocument([
    createCodeBlock(texts.map((text) => createText(text))),
    createParagraph([createText("后方正文")]),
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
  return { container, value, onTransaction };
}

function selectCode(
  container: HTMLElement,
  path: number[],
  start: number,
  end = start,
) {
  const text = container.querySelector(
    `[data-crucialy-path="${JSON.stringify(path)}"]`,
  )?.firstChild;
  const selection = window.getSelection();
  if (!text || !selection) {
    throw new Error("Missing rendered code text.");
  }
  const range = document.createRange();
  range.setStart(text, start);
  range.setEnd(text, end);
  selection.removeAllRanges();
  selection.addRange(range);
}

function paste(container: HTMLElement, formats: Record<string, string>) {
  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", {
    value: {
      types: Object.keys(formats),
      getData: (type: string) => formats[type] ?? "",
    },
  });
  act(() => {
    container.firstElementChild?.dispatchEvent(event);
  });
  return event;
}

describe("RichTextEditor CodeBlock plain clipboard paste", () => {
  it("falls back to literal plain code rather than importing HTML or Markdown", () => {
    const { container, onTransaction } = renderCode(["前后"]);
    selectCode(container, [0, 0], 1);
    const text = "<b>`x`</b>\n\tvalue";
    expect(
      paste(container, {
        "text/markdown": "# 标题",
        "text/html": "<p><b>富内容</b></p>",
        "text/plain": text,
      }).defaultPrevented,
    ).toBe(true);
    expect(container.querySelector("pre code")?.textContent).toBe(`前${text}后`);
    expect(container.querySelector("strong, b, h1")).toBeNull();
    expect(onTransaction).toHaveBeenCalledTimes(1);
    expect(onTransaction.mock.calls[0]?.[0].after).toEqual(
      createDocument([
        createCodeBlock([createText(`前${text}后`)]),
        createParagraph([createText("后方正文")]),
      ]),
    );
  });

  it.each(["text/html", "text/markdown"])(
    "does not modify code for a rich-only %s clipboard",
    (type) => {
      const { container, onTransaction } = renderCode(["前旧后"]);
      selectCode(container, [0, 0], 1, 2);
      expect(
        paste(container, {
          [type]: type === "text/html" ? "<p>富内容</p>" : "# 富内容",
        }).defaultPrevented,
      ).toBe(true);
      expect(container.querySelector("pre code")?.textContent).toBe("前旧后");
      expect(onTransaction).not.toHaveBeenCalled();
    },
  );

  it("does not erase a selected code range when the supplied plain text is empty", () => {
    const { container, onTransaction } = renderCode(["前旧后"]);
    selectCode(container, [0, 0], 1, 2);
    expect(
      paste(container, { "text/html": "<p>富内容</p>", "text/plain": "" })
        .defaultPrevented,
    ).toBe(true);
    expect(container.querySelector("pre code")?.textContent).toBe("前旧后");
    expect(onTransaction).not.toHaveBeenCalled();
  });

  it.each([
    {
      texts: ["前后"],
      path: [0, 0],
      start: 1,
      end: 1,
      input: "甲\n\n乙\n",
      expected: "前甲\n\n乙\n后",
      offset: 6,
    },
    {
      texts: ["开旧尾"],
      path: [0, 0],
      start: 1,
      end: 2,
      input: "甲\n乙",
      expected: "开甲\n乙尾",
      offset: 4,
    },
    {
      texts: ["前", "后尾"],
      path: [0, 1],
      start: 1,
      end: 1,
      input: "甲\n乙",
      expected: "前后甲\n乙尾",
      offset: 5,
    },
    {
      texts: ["前后"],
      path: [0, 0],
      start: 1,
      end: 1,
      input: "\t甲\r\n  乙",
      expected: "前\t甲\n  乙后",
      offset: 7,
    },
  ])(
    "pastes $input as one code text transaction",
    ({ texts, path, start, end, input, expected, offset }) => {
      const { container, value, onTransaction } = renderCode(texts);
      selectCode(container, path, start, end);
      expect(paste(container, { "text/plain": input }).defaultPrevented).toBe(true);
      expect(container.querySelectorAll("pre")).toHaveLength(1);
      expect(container.querySelector("pre code")?.textContent).toBe(expected);
      expect(container.querySelector("p")?.textContent).toBe("后方正文");
      expect(onTransaction).toHaveBeenCalledTimes(1);
      const change = onTransaction.mock.calls[0]?.[0];
      expect(change.before).toEqual(value);
      expect(change.inputType).toBe("insertFromPaste");
      expect(change.selection).toEqual({
        anchor: { path: [0, 0], offset },
        focus: { path: [0, 0], offset },
      });
      expect(
        change.transaction.operations.map(
          (operation: { type: string }) => operation.type,
        ),
      ).toEqual(start === end ? ["insert_text"] : ["delete_text", "insert_text"]);
    },
  );
});
