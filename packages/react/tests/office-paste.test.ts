// @vitest-environment jsdom

import {
  createDocument,
  createCodeBlock,
  createListItem,
  createOrderedList,
  createTaskItem,
  createTaskList,
  createTable,
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
  it("preserves literal code and does not split the block", () => {
    const { container, onTransaction } = renderEditor(
      createDocument([createCodeBlock([createText("开旧尾")])]),
    );
    selectText(container);
    paste(container, { ...officeFormats, "text/plain": "<b>甲</b>\n\t乙\n" });
    expect(container.querySelectorAll("pre")).toHaveLength(1);
    expect(container.querySelector("code")?.textContent).toBe("开<b>甲</b>\n\t乙\n尾");
    expect(onTransaction).toHaveBeenCalledTimes(1);
    expect(onTransaction.mock.calls[0]?.[0].selection.anchor).toEqual({
      path: [0, 0],
      offset: 13,
    });
  });

  it.each([
    {
      name: "ordered",
      node: createOrderedList([createListItem([createText("开旧尾")])], 7),
    },
    {
      name: "task",
      node: createTaskList([createTaskItem([createText("开旧尾")], true)]),
    },
  ])(
    "preserves $name list state when splitting plain Office lines",
    ({ name, node }) => {
      const { container, onTransaction } = renderEditor(createDocument([node]));
      selectText(container, "[0,0,0]");
      paste(container, officeFormats);
      expect(
        Array.from(container.querySelectorAll("li"), (item) => item.textContent),
      ).toEqual(["开甲", "乙尾"]);
      if (name === "ordered")
        expect(container.querySelector("ol")?.getAttribute("start")).toBe("7");
      if (name === "task")
        expect(
          Array.from(container.querySelectorAll("input"), (input) => input.checked),
        ).toEqual([true, false]);
      expect(onTransaction).toHaveBeenCalledTimes(1);
    },
  );

  it.each([true, false])(
    "uses existing cell rules for Office TSV (range: %s)",
    (range) => {
      const table = createTable(2, 2);
      table.children[0]!.children[0]!.children = [
        createParagraph([createText("开旧尾")]),
      ];
      const { container, onTransaction } = renderEditor(createDocument([table]));
      selectText(container, "[0,0,0,0,0]", 1, range ? 2 : 1);
      paste(container, { ...officeFormats, "text/plain": "甲\t乙\r\n丙\t丁" });
      const cells = container.querySelectorAll("td");
      expect(cells).toHaveLength(4);
      if (range) {
        expect(
          Array.from(cells[0]!.querySelectorAll("p"), (p) => p.textContent),
        ).toEqual(["开甲\t乙", "丙\t丁尾"]);
        expect(
          Array.from(cells)
            .slice(1)
            .map((cell) => cell.textContent),
        ).toEqual(["", "", ""]);
      } else {
        expect(Array.from(cells, (cell) => cell.textContent)).toEqual([
          "甲",
          "乙",
          "丙",
          "丁",
        ]);
      }
      expect(onTransaction).toHaveBeenCalledTimes(1);
    },
  );

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
