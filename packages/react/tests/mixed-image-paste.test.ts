// @vitest-environment jsdom

import {
  createBulletList,
  createCodeBlock,
  createDocument,
  createListItem,
  createParagraph,
  createTable,
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
  for (const root of roots.splice(0)) act(() => root.unmount());
  document.body.replaceChildren();
});

function renderEditor(value: DocumentNode) {
  const container = document.createElement("div");
  const root = createRoot(container);
  roots.push(root);
  document.body.append(container);
  const onTransaction = vi.fn();
  const onChange = vi.fn();
  act(() =>
    root.render(
      createElement(RichTextEditor, {
        contentEditable: true,
        defaultValue: value,
        onTransaction,
        onChange,
      }),
    ),
  );
  return { container, onTransaction, onChange };
}

function paste(
  container: HTMLElement,
  path: number[],
  formats: Record<string, string>,
) {
  const text = container.querySelector(
    `[data-crucialy-path="${JSON.stringify(path)}"]`,
  )?.firstChild;
  if (!text) throw new Error("Missing mixed image paste target.");
  const range = document.createRange();
  range.setStart(text, 1);
  range.setEnd(text, 2);
  window.getSelection()!.removeAllRanges();
  window.getSelection()!.addRange(range);
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

const html =
  '<p><b>前<img src="https://example.com/mixed.png" alt="配图" width="640">后</b></p>';
const markdown = "**前![配图](https://example.com/mixed.png)后**";

describe("RichTextEditor mixed image clipboard", () => {
  for (const format of ["html", "markdown"] as const) {
    it.each([false, true])(
      `inserts ${format} blocks atomically (trailing image: %s)`,
      (trailing) => {
        const { container, onTransaction, onChange } = renderEditor(
          createDocument([createParagraph([createText("开旧尾")])]),
        );
        const rich =
          format === "html"
            ? trailing
              ? '<p>前<img src="https://example.com/mixed.png" alt="配图"></p>'
              : html
            : trailing
              ? "前![配图](https://example.com/mixed.png)"
              : markdown;
        const event = paste(container, [0, 0], {
          [`text/${format}`]: rich,
          "text/plain": "不应降级",
        });
        expect(event.defaultPrevented).toBe(true);
        expect(
          Array.from(container.querySelectorAll("p"), (node) => node.textContent),
        ).toEqual(trailing ? ["开", "前", "尾"] : ["开", "前", "后", "尾"]);
        expect(container.querySelectorAll("img")).toHaveLength(1);
        expect(container.querySelector("img")?.getAttribute("alt")).toBe("配图");
        if (!trailing)
          expect(
            Array.from(
              container.querySelectorAll("strong"),
              (node) => node.textContent,
            ),
          ).toEqual(["前", "后"]);
        expect(onTransaction).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onTransaction.mock.calls[0]?.[0]).toMatchObject({
          inputType: "insertFromPaste",
          selection: { anchor: { path: [3, 0], offset: trailing ? 0 : 1 } },
        });
      },
    );
  }

  const table = createTable(1, 1);
  table.children[0]!.children[0]!.children = [createParagraph([createText("开旧尾")])];
  it.each([
    {
      name: "code",
      document: createDocument([createCodeBlock([createText("开旧尾")])]),
      path: [0, 0],
    },
    {
      name: "list",
      document: createDocument([
        createBulletList([createListItem([createText("开旧尾")])]),
      ]),
      path: [0, 0, 0],
    },
    { name: "cell", document: createDocument([table]), path: [0, 0, 0, 0, 0] },
  ])(
    "keeps $name rich-paste restrictions and supplied plain fallback",
    ({ document, path }) => {
      const { container, onTransaction } = renderEditor(document);
      expect(
        paste(container, path, {
          "text/markdown": markdown,
          "text/html": html,
          "text/plain": "纯",
        }).defaultPrevented,
      ).toBe(true);
      expect(container.querySelector("img")).toBeNull();
      expect(container.textContent).toBe("开纯尾");
      expect(onTransaction).toHaveBeenCalledTimes(1);
    },
  );

  it.each([false, true])("still applies Office source policy (plain: %s)", (plain) => {
    const { container, onTransaction } = renderEditor(
      createDocument([createParagraph([createText("开旧尾")])]),
    );
    expect(
      paste(container, [0, 0], {
        "text/html": html.replace("<p>", '<p class="MsoNormal">'),
        "text/markdown": markdown,
        ...(plain ? { "text/plain": "纯" } : {}),
      }).defaultPrevented,
    ).toBe(true);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toBe(plain ? "开纯尾" : "开旧尾");
    expect(onTransaction).toHaveBeenCalledTimes(plain ? 1 : 0);
  });
});
