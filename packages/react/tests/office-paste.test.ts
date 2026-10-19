// @vitest-environment jsdom

import {
  createDocument,
  createParagraph,
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

function renderEditor(
  value = createDocument([createParagraph([createText("开旧尾")])]),
  props: Partial<RichTextEditorProps> = {},
) {
  const container = document.createElement("div");
  const root = createRoot(container);
  const onTransaction = vi.fn();
  const onChange = vi.fn<(document: DocumentNode) => void>();
  roots.push(root);
  document.body.append(container);
  act(() =>
    root.render(
      createElement(RichTextEditor, {
        contentEditable: true,
        defaultValue: value,
        onTransaction,
        onChange,
        ...props,
      }),
    ),
  );
  return { container, onTransaction, onChange };
}

function selectText(container: HTMLElement, path = "[0,0]", start = 1, end = 2) {
  const text = container.querySelector(`[data-crucialy-path="${path}"]`)?.firstChild;
  if (!text) throw new Error("Missing Office paste target.");
  const range = document.createRange();
  range.setStart(text, start);
  range.setEnd(text, end);
  window.getSelection()!.removeAllRanges();
  window.getSelection()!.addRange(range);
}

function paste(container: HTMLElement, formats: Record<string, string>) {
  const event = new Event("paste", { bubbles: true, cancelable: true });
  const getData = vi.fn((type: string) => formats[type] ?? "");
  Object.defineProperty(event, "clipboardData", {
    value: { types: Object.keys(formats), getData },
  });
  act(() => {
    container.firstElementChild?.dispatchEvent(event);
  });
  return { event, getData };
}

const officeFormats = {
  "text/html": '<p class="MsoNormal"><b>Office rich</b></p>',
  "text/markdown": "# Markdown rich",
  "text/plain": "甲\r\n乙",
};

describe("RichTextEditor Office clipboard policy", () => {
  it("replaces selected prose with supplied plain text in one transaction", () => {
    const { container, onTransaction, onChange } = renderEditor();
    selectText(container);
    expect(paste(container, officeFormats).event.defaultPrevented).toBe(true);
    expect(
      Array.from(container.querySelectorAll("p"), (node) => node.textContent),
    ).toEqual(["开甲", "乙尾"]);
    expect(container.querySelector("strong, h1")).toBeNull();
    expect(onTransaction).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onTransaction.mock.calls[0]?.[0]).toMatchObject({
      inputType: "insertFromPaste",
      selection: {
        anchor: { path: [1, 0], offset: 1 },
        focus: { path: [1, 0], offset: 1 },
      },
    });
  });

  it.each([undefined, ""])(
    "leaves selected prose untouched without nonempty plain data (%s)",
    (plain) => {
      const { container, onTransaction, onChange } = renderEditor();
      selectText(container);
      const rich = {
        "text/html": officeFormats["text/html"],
        "text/markdown": officeFormats["text/markdown"],
      };
      expect(
        paste(container, {
          ...rich,
          ...(plain === undefined ? {} : { "text/plain": plain }),
        }).event.defaultPrevented,
      ).toBe(true);
      expect(container.querySelector("p")?.textContent).toBe("开旧尾");
      expect(onTransaction).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
    },
  );

  it("does not inspect clipboard formats when the host cancels paste", () => {
    const { container, onTransaction } = renderEditor(undefined, {
      onPaste: (event) => event.preventDefault(),
    });
    selectText(container);
    expect(paste(container, officeFormats).getData).not.toHaveBeenCalled();
    expect(onTransaction).not.toHaveBeenCalled();
  });

  it("leaves readonly Office paste to the host", () => {
    const { container, onTransaction } = renderEditor(undefined, {
      contentEditable: false,
    });
    selectText(container);
    const { event, getData } = paste(container, officeFormats);
    expect(event.defaultPrevented).toBe(false);
    expect(getData).not.toHaveBeenCalled();
    expect(onTransaction).not.toHaveBeenCalled();
  });
});
