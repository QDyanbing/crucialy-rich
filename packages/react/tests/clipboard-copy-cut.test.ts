// @vitest-environment jsdom

import {
  createDocument,
  createBlockSelection,
  createDivider,
  createImage,
  createBulletList,
  createListItem,
  createOrderedList,
  createTaskItem,
  createTaskList,
  parseHtml,
  createCommandRegistry,
  createCommandSuccess,
  createTable,
  createTransaction,
  deleteSelectionCommand,
  createParagraph,
  createText,
  type RangeSelection,
} from "@crucialy-rich/core";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RichTextEditor, type RichTextEditorProps } from "../src";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const roots: ReturnType<typeof createRoot>[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) act(() => root.unmount());
  document.body.replaceChildren();
});

function renderEditor(
  value = createDocument([createParagraph([createText("前甲乙后")])]),
  props: Partial<RichTextEditorProps> = {},
) {
  const container = document.createElement("div");
  const root = createRoot(container);
  const onChange = vi.fn();
  const onSelectionChange = vi.fn();
  const onTransaction = vi.fn();
  roots.push(root);
  document.body.append(container);
  act(() =>
    root.render(
      createElement(RichTextEditor, {
        defaultValue: value,
        contentEditable: true,
        onChange,
        onSelectionChange,
        onTransaction,
        ...props,
      }),
    ),
  );
  return { container, value, root, onChange, onSelectionChange, onTransaction };
}

function select(
  container: HTMLElement,
  selection: RangeSelection = {
    anchor: { path: [0, 0], offset: 1 },
    focus: { path: [0, 0], offset: 3 },
  },
) {
  function text(path: number[]) {
    return container.querySelector(`[data-crucialy-path="${JSON.stringify(path)}"]`)!
      .firstChild!;
  }
  window
    .getSelection()!
    .setBaseAndExtent(
      text(selection.anchor.path),
      selection.anchor.offset,
      text(selection.focus.path),
      selection.focus.offset,
    );
}

function clipboard(
  container: HTMLElement,
  type: "copy" | "cut",
  fail: boolean | "text/html" = false,
) {
  const data: Record<string, string> = {};
  const setData = vi.fn((mime: string, text: string) => {
    if (fail === true || fail === mime) throw new Error("Clipboard is unavailable.");
    data[mime] = text;
  });
  const clearData = vi.fn(() => {
    for (const key of Object.keys(data)) delete data[key];
  });
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", { value: { setData, clearData } });
  act(() => container.firstElementChild!.dispatchEvent(event));
  return { event, data, setData, clearData };
}

describe("RichTextEditor selected image clipboard", () => {
  const value = createDocument([
    createParagraph([createText("前甲乙后")]),
    createImage("https://example.com/a.png", {
      alt: "中文图片",
      width: 120,
      height: 80,
    }),
    createParagraph([createText("正文")]),
  ]);

  function focusRoot(container: HTMLElement) {
    const root = container.firstElementChild as HTMLElement;
    root.tabIndex = 0;
    root.focus();
  }

  it("does not copy stale text or native HTML in default plain mode", () => {
    const host = renderEditor(value, { blockSelection: createBlockSelection([1]) });
    focusRoot(host.container);
    select(host.container);
    const copied = clipboard(host.container, "copy");
    expect(copied.event.defaultPrevented).toBe(true);
    expect(copied.setData).not.toHaveBeenCalled();
  });

  it.each([
    createImage("blob:https://example.com/local"),
    createImage("https://example.com/a.png", { status: "loading" }),
    createImage("https://example.com/a.png", { status: "error" }),
    createImage("https://user:secret@example.com/a.png"),
  ])(
    "does not fall back to old text for unsupported selected image $src ($status)",
    (image) => {
      const document = structuredClone(value);
      document.children[1] = image;
      const host = renderEditor(document, {
        clipboardFormat: "html",
        blockSelection: createBlockSelection([1]),
      });
      focusRoot(host.container);
      select(host.container);
      const copied = clipboard(host.container, "copy");
      expect(copied.event.defaultPrevented).toBe(true);
      expect(copied.setData).not.toHaveBeenCalled();
      expect(host.onTransaction).not.toHaveBeenCalled();
    },
  );

  it("does not use stale text when the controlled block path is invalid", () => {
    const host = renderEditor(value, {
      clipboardFormat: "html",
      blockSelection: createBlockSelection([8]),
    });
    focusRoot(host.container);
    select(host.container);
    expect(clipboard(host.container, "copy").setData).not.toHaveBeenCalled();
    expect(clipboard(host.container, "cut").setData).not.toHaveBeenCalled();
    expect(host.onChange).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    "rejects an unfocused editor or DOM selection in another editor (%s)",
    (outside) => {
      const host = renderEditor(value, {
        clipboardFormat: "html",
        blockSelection: createBlockSelection([1]),
      });
      const other = renderEditor();
      if (outside) focusRoot(host.container);
      else focusRoot(other.container);
      select(other.container);
      expect(clipboard(host.container, "copy").setData).not.toHaveBeenCalled();
    },
  );

  it("keeps host cancellation authoritative for selected image copy and cut", () => {
    const cancel = vi.fn((event) => event.preventDefault());
    const host = renderEditor(value, {
      clipboardFormat: "html",
      blockSelection: createBlockSelection([1]),
      onCopy: cancel,
      onCut: cancel,
    });
    window.getSelection()!.removeAllRanges();
    focusRoot(host.container);
    expect(clipboard(host.container, "copy").setData).not.toHaveBeenCalled();
    expect(clipboard(host.container, "cut").setData).not.toHaveBeenCalled();
    expect(cancel).toHaveBeenCalledTimes(2);
  });

  it.each([false, true])(
    "refuses image copy with only one DOM endpoint inside (%s)",
    (backward) => {
      const host = renderEditor(value, {
        clipboardFormat: "html",
        blockSelection: createBlockSelection([1]),
      });
      const outside = document.createElement("p");
      outside.textContent = "外部";
      document.body.append(outside);
      focusRoot(host.container);
      const inside = host.container.querySelector("span")!.firstChild!;
      const external = outside.firstChild!;
      window
        .getSelection()!
        .setBaseAndExtent(
          backward ? external : inside,
          0,
          backward ? inside : external,
          1,
        );
      const copied = clipboard(host.container, "copy");
      expect(copied.event.defaultPrevented).toBe(false);
      expect(copied.setData).not.toHaveBeenCalled();
      expect(host.onTransaction).not.toHaveBeenCalled();
    },
  );

  it("does not export an image block during composition", () => {
    const host = renderEditor(value, {
      clipboardFormat: "html",
      blockSelection: createBlockSelection([1]),
    });
    focusRoot(host.container);
    select(host.container);
    act(() =>
      host.container.firstElementChild!.dispatchEvent(
        new CompositionEvent("compositionstart", { bubbles: true }),
      ),
    );
    expect(clipboard(host.container, "copy").setData).not.toHaveBeenCalled();
    expect(clipboard(host.container, "cut").setData).not.toHaveBeenCalled();
    expect(host.onTransaction).not.toHaveBeenCalled();
  });

  it("does not change the model or selection if image HTML writing fails", () => {
    const host = renderEditor(value, {
      clipboardFormat: "html",
      blockSelection: createBlockSelection([1]),
    });
    window.getSelection()!.removeAllRanges();
    focusRoot(host.container);
    const copied = clipboard(host.container, "copy", "text/html");
    expect(copied.event.defaultPrevented).toBe(true);
    expect(copied.data).toEqual({ "text/plain": "" });
    expect(host.onChange).not.toHaveBeenCalled();
    expect(host.onSelectionChange).not.toHaveBeenCalled();
    expect(host.onTransaction).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    "copies the selected image instead of an old range (%s)",
    (oldRange) => {
      const host = renderEditor(value, {
        clipboardFormat: "html",
        blockSelection: createBlockSelection([1]),
      });
      focusRoot(host.container);
      if (oldRange) select(host.container);
      else window.getSelection()!.removeAllRanges();
      const copied = clipboard(host.container, "copy");
      expect(copied.data["text/plain"]).toBe("");
      expect(parseHtml(copied.data["text/html"]!)?.blocks).toEqual([value.children[1]]);
      expect(host.onChange).not.toHaveBeenCalled();
      expect(host.onSelectionChange).not.toHaveBeenCalled();
      expect(host.onTransaction).not.toHaveBeenCalled();
    },
  );

  it("supports a focused readonly controlled image selection without commands", () => {
    const host = renderEditor(value, {
      value,
      contentEditable: false,
      clipboardFormat: "html",
      blockSelection: createBlockSelection([1]),
      commandRegistry: createCommandRegistry([]),
    });
    window.getSelection()!.removeAllRanges();
    focusRoot(host.container);
    expect(clipboard(host.container, "copy").data["text/html"]).toContain(
      'alt="中文图片"',
    );
    expect(host.onTransaction).not.toHaveBeenCalled();
  });

  it("cuts only the image instead of stale text after both formats are written", () => {
    const onBlockSelectionChange = vi.fn();
    const host = renderEditor(value, {
      clipboardFormat: "html",
      blockSelection: createBlockSelection([1]),
      onBlockSelectionChange,
    });
    focusRoot(host.container);
    select(host.container);
    const cut = clipboard(host.container, "cut");
    expect(cut.event.defaultPrevented).toBe(true);
    expect(cut.data["text/plain"]).toBe("");
    expect(parseHtml(cut.data["text/html"]!)?.blocks).toEqual([value.children[1]]);
    expect(host.container.querySelector("img")).toBeNull();
    expect(host.container.textContent).toBe("前甲乙后正文");
    expect(host.onChange).toHaveBeenCalledTimes(1);
    expect(host.onTransaction).toHaveBeenCalledTimes(1);
    const change = host.onTransaction.mock.calls[0]![0];
    expect(change).toMatchObject({
      before: value,
      inputType: "deleteByCut",
      beforeSelection: {
        anchor: { path: [0, 0], offset: 1 },
        focus: { path: [0, 0], offset: 3 },
      },
      selection: {
        anchor: { path: [1, 0], offset: 0 },
        focus: { path: [1, 0], offset: 0 },
      },
    });
    expect(change).not.toHaveProperty("batch");
    expect(cut.setData.mock.invocationCallOrder.at(-1)).toBeLessThan(
      host.onChange.mock.invocationCallOrder[0]!,
    );
    expect(onBlockSelectionChange).toHaveBeenCalledExactlyOnceWith(undefined);
  });
});

describe("RichTextEditor enclosed image clipboard", () => {
  function imageValue(
    image = createImage("https://example.com/a.png", {
      alt: "中文图片",
      width: 120,
      height: 80,
    }),
  ) {
    return createDocument([
      createParagraph([createText("前甲", { bold: true })]),
      image,
      createParagraph([createText("乙后", { italic: true })]),
    ]);
  }
  const range = {
    anchor: { path: [0, 0], offset: 1 },
    focus: { path: [2, 0], offset: 1 },
  };

  it("keeps image copy plain by default and refuses cross-image cut", () => {
    const host = renderEditor(imageValue());
    select(host.container, range);
    expect(clipboard(host.container, "copy").data).toEqual({
      "text/plain": "甲\n\n乙",
    });
    const rich = renderEditor(imageValue(), { clipboardFormat: "html" });
    select(rich.container, range);
    const before = rich.container.innerHTML;
    const cut = clipboard(rich.container, "cut");
    expect(cut.event.defaultPrevented).toBe(true);
    expect(cut.clearData).not.toHaveBeenCalled();
    expect(cut.setData).not.toHaveBeenCalled();
    expect(rich.container.innerHTML).toBe(before);
    expect(rich.onTransaction).not.toHaveBeenCalled();
  });

  it.each([
    createImage("blob:https://example.com/local"),
    createImage("https://example.com/a.png", { status: "loading" }),
    createImage("https://example.com/a.png", { status: "error" }),
    createImage("https://user:secret@example.com/a.png"),
  ])(
    "falls back to complete plain text for unsupported image $src ($status)",
    (image) => {
      const host = renderEditor(imageValue(image), { clipboardFormat: "html" });
      select(host.container, range);
      expect(clipboard(host.container, "copy").data).toEqual({
        "text/plain": "甲\n\n乙",
      });
      expect(host.onTransaction).not.toHaveBeenCalled();
    },
  );

  it("does not edit when the image HTML clipboard write is rejected", () => {
    const host = renderEditor(imageValue(), { clipboardFormat: "html" });
    select(host.container, range);
    const result = clipboard(host.container, "copy", "text/html");
    expect(result.event.defaultPrevented).toBe(true);
    expect(result.data).toEqual({ "text/plain": "甲\n\n乙" });
    expect(host.onChange).not.toHaveBeenCalled();
    expect(host.onTransaction).not.toHaveBeenCalled();
  });

  it("lets the host cancel image format export", () => {
    const onCopy = vi.fn((event) => event.preventDefault());
    const host = renderEditor(imageValue(), { clipboardFormat: "html", onCopy });
    select(host.container, range);
    expect(clipboard(host.container, "copy").setData).not.toHaveBeenCalled();
    expect(onCopy).toHaveBeenCalledOnce();
  });

  it.each([false, true])(
    "copies image metadata from the model in either direction (%s)",
    (backward) => {
      const value = imageValue();
      const host = renderEditor(value, { clipboardFormat: "html" });
      select(
        host.container,
        backward ? { anchor: range.focus, focus: range.anchor } : range,
      );
      const copied = clipboard(host.container, "copy");
      expect(copied.data["text/plain"]).toBe("甲\n\n乙");
      const expected = imageValue().children;
      expected[0] = createParagraph([createText("甲", { bold: true })]);
      expected[2] = createParagraph([createText("乙", { italic: true })]);
      expect(parseHtml(copied.data["text/html"]!)?.blocks).toEqual(expected);
      expect(host.onChange).not.toHaveBeenCalled();
      expect(host.onSelectionChange).not.toHaveBeenCalled();
      expect(host.onTransaction).not.toHaveBeenCalled();
    },
  );

  it("supports readonly controlled copy without editing commands", () => {
    const value = imageValue();
    const host = renderEditor(value, {
      value,
      contentEditable: false,
      clipboardFormat: "html",
      commandRegistry: createCommandRegistry([]),
    });
    select(host.container, range);
    expect(clipboard(host.container, "copy").data["text/html"]).toContain(
      'alt="中文图片"',
    );
    expect(host.onTransaction).not.toHaveBeenCalled();
  });

  it("ignores altered DOM image attributes when exporting the model", () => {
    const host = renderEditor(imageValue(), { clipboardFormat: "html" });
    const image = host.container.querySelector("img")!;
    image.setAttribute("src", "https://example.com/dom-only.png");
    image.setAttribute("alt", "DOM 文字");
    image.setAttribute("onerror", "unsafe");
    select(host.container, range);
    const html = clipboard(host.container, "copy").data["text/html"]!;
    expect(html).toContain('src="https://example.com/a.png"');
    expect(html).not.toMatch(/DOM 文字|dom-only|onerror=/);
  });
});

describe("RichTextEditor mixed block clipboard", () => {
  function mixedValue() {
    return createDocument([
      createParagraph([createText("前甲", { bold: true })]),
      createOrderedList([createListItem([createText("列表")])], 5),
      createDivider(),
      createTable(1, 1),
      createParagraph([createText("乙后", { italic: true })]),
    ]);
  }
  const range = {
    anchor: { path: [0, 0], offset: 1 },
    focus: { path: [4, 0], offset: 1 },
  };

  it.each([false, true])(
    "copies complete structures but refuses mixed cut (%s)",
    (backward) => {
      const host = renderEditor(mixedValue(), { clipboardFormat: "html" });
      select(
        host.container,
        backward ? { anchor: range.focus, focus: range.anchor } : range,
      );
      const copied = clipboard(host.container, "copy");
      expect(copied.data["text/plain"]).toBe("甲\n列表\n\n\n乙");
      const expected = mixedValue().children;
      expected[0] = createParagraph([createText("甲", { bold: true })]);
      expected[4] = createParagraph([createText("乙", { italic: true })]);
      expect(parseHtml(copied.data["text/html"]!)?.blocks).toEqual(expected);
      const cut = clipboard(host.container, "cut");
      expect(cut.event.defaultPrevented).toBe(true);
      expect(cut.setData).not.toHaveBeenCalled();
      expect(host.onChange).not.toHaveBeenCalled();
      expect(host.onSelectionChange).not.toHaveBeenCalled();
      expect(host.onTransaction).not.toHaveBeenCalled();
    },
  );

  it("supports readonly controlled copy without a command registry", () => {
    const value = mixedValue();
    const host = renderEditor(value, {
      value,
      clipboardFormat: "html",
      contentEditable: false,
      commandRegistry: createCommandRegistry([]),
    });
    select(host.container, range);
    expect(clipboard(host.container, "copy").data["text/html"]).toContain("<table>");
    expect(host.onChange).not.toHaveBeenCalled();
    expect(host.onTransaction).not.toHaveBeenCalled();
  });

  it("keeps the complete default plain range without HTML", () => {
    const host = renderEditor(mixedValue());
    select(host.container, range);
    expect(clipboard(host.container, "copy").data).toEqual({
      "text/plain": "甲\n列表\n\n\n乙",
    });
  });

  it("keeps the source intact if the mixed HTML write fails", () => {
    const host = renderEditor(mixedValue(), { clipboardFormat: "html" });
    select(host.container, range);
    const before = host.container.innerHTML;
    const copied = clipboard(host.container, "copy", "text/html");
    expect(copied.event.defaultPrevented).toBe(true);
    expect(copied.data).toEqual({ "text/plain": "甲\n列表\n\n\n乙" });
    expect(host.container.innerHTML).toBe(before);
    expect(host.onTransaction).not.toHaveBeenCalled();
  });

  it("does not export partial HTML around a temporary image", () => {
    const value = mixedValue();
    value.children[2] = createImage("blob:https://example.com/local");
    const host = renderEditor(value, { clipboardFormat: "html" });
    select(host.container, range);
    expect(clipboard(host.container, "copy").data).toEqual({
      "text/plain": "甲\n列表\n\n\n乙",
    });
  });

  it("lets host cancellation bypass mixed fragment export", () => {
    const onCopy = vi.fn((event) => event.preventDefault());
    const host = renderEditor(mixedValue(), { clipboardFormat: "html", onCopy });
    select(host.container, range);
    expect(clipboard(host.container, "copy").setData).not.toHaveBeenCalled();
    expect(onCopy).toHaveBeenCalledOnce();
  });
});

describe("RichTextEditor sibling list clipboard", () => {
  const range: RangeSelection = {
    anchor: { path: [0, 1, 0], offset: 1 },
    focus: { path: [0, 2, 0], offset: 1 },
  };
  const items = ["未选", "甲乙", "丙丁"].map((text) =>
    createListItem([createText(text)]),
  );

  it.each(["bullet", "ordered", "task"])(
    "copies %s structure without editing",
    (type) => {
      const list =
        type === "ordered"
          ? createOrderedList(items, 7)
          : type === "task"
            ? createTaskList(
                items.map((item, index) => createTaskItem(item.children, index === 1)),
              )
            : createBulletList(items);
      const host = renderEditor(createDocument([list]), { clipboardFormat: "html" });
      select(host.container, range);
      const copied = clipboard(host.container, "copy");
      const blocks = parseHtml(copied.data["text/html"]!)?.blocks;
      expect(copied.data["text/plain"]).toBe("乙\n丙");
      expect(blocks?.[0]?.type).toBe(list.type);
      expect(copied.data["text/html"]).not.toMatch(/未选|data-|aria-/);
      if (type === "ordered") expect(copied.data["text/html"]).toContain('start="8"');
      if (type === "task")
        expect(blocks).toEqual([
          createTaskList([
            createTaskItem([createText("乙")], true),
            createTaskItem([createText("丙")]),
          ]),
        ]);
      expect(host.onChange).not.toHaveBeenCalled();
      expect(host.onSelectionChange).not.toHaveBeenCalled();
      expect(host.onTransaction).not.toHaveBeenCalled();
    },
  );

  it("keeps default plain copy unchanged for the same sibling range", () => {
    const host = renderEditor(createDocument([createBulletList(items)]));
    select(host.container, range);
    expect(clipboard(host.container, "copy").data).toEqual({ "text/plain": "乙\n丙" });
  });

  it("still refuses cross-item cut before writing either format", () => {
    const host = renderEditor(createDocument([createBulletList(items)]), {
      clipboardFormat: "html",
    });
    select(host.container, range);
    const cut = clipboard(host.container, "cut");
    expect(cut.event.defaultPrevented).toBe(true);
    expect(cut.setData).not.toHaveBeenCalled();
    expect(host.container.textContent).toBe("未选甲乙丙丁");
    expect(host.onTransaction).not.toHaveBeenCalled();
  });

  it("copies the complete plain range when endpoints belong to different list levels", () => {
    const host = renderEditor(
      createDocument([
        createBulletList([
          createListItem(
            [createText("父")],
            createBulletList([createListItem([createText("子")])]),
          ),
        ]),
      ]),
      { clipboardFormat: "html" },
    );
    select(host.container, {
      anchor: { path: [0, 0, 0], offset: 0 },
      focus: { path: [0, 0, 1, 0, 0], offset: 1 },
    });
    expect(clipboard(host.container, "copy").data).toEqual({ "text/plain": "父\n子" });
  });
});

describe("RichTextEditor structured table copy", () => {
  function tableValue() {
    const table = createTable(2, 2);
    for (const row of table.children)
      for (const cell of row.children)
        cell.children = [createParagraph([createText("文字")])];
    return createDocument([table]);
  }

  it.each([false, true])(
    "does not cut a supported HTML table range (complete rows: %s)",
    (rows) => {
      const host = renderEditor(tableValue(), { clipboardFormat: "html" });
      select(host.container, {
        anchor: { path: [0, 0, 0, 0, 0], offset: 0 },
        focus: { path: [0, rows ? 1 : 0, 1, 0, 0], offset: 2 },
      });
      expect(clipboard(host.container, "copy").data["text/html"]).toContain("<table>");
      const before = host.container.innerHTML;
      const cut = clipboard(host.container, "cut");
      expect(cut.event.defaultPrevented).toBe(true);
      expect(cut.clearData).not.toHaveBeenCalled();
      expect(cut.setData).not.toHaveBeenCalled();
      expect(host.container.innerHTML).toBe(before);
      expect(host.onChange).not.toHaveBeenCalled();
      expect(host.onTransaction).not.toHaveBeenCalled();
    },
  );

  it("keeps default plain copy and partial-row HTML fallback complete", () => {
    const host = renderEditor(tableValue());
    select(host.container, {
      anchor: { path: [0, 0, 0, 0, 0], offset: 0 },
      focus: { path: [0, 1, 1, 0, 0], offset: 2 },
    });
    expect(clipboard(host.container, "copy").data).toEqual({
      "text/plain": "文字\t文字\n文字\t文字",
    });
    const rich = renderEditor(tableValue(), { clipboardFormat: "html" });
    select(rich.container, {
      anchor: { path: [0, 0, 0, 0, 0], offset: 1 },
      focus: { path: [0, 1, 1, 0, 0], offset: 1 },
    });
    expect(clipboard(rich.container, "copy").data).toEqual({
      "text/plain": "字\t文字\n文字\t文",
    });
  });

  it("does not edit when the table HTML clipboard write is rejected", () => {
    const host = renderEditor(tableValue(), { clipboardFormat: "html" });
    select(host.container, {
      anchor: { path: [0, 0, 0, 0, 0], offset: 0 },
      focus: { path: [0, 0, 1, 0, 0], offset: 2 },
    });
    const copied = clipboard(host.container, "copy", "text/html");
    expect(copied.event.defaultPrevented).toBe(true);
    expect(copied.data).toEqual({ "text/plain": "文字\t文字" });
    expect(host.onChange).not.toHaveBeenCalled();
    expect(host.onTransaction).not.toHaveBeenCalled();
  });

  it.each([false, true])("copies a styled row range with backward=%s", (backward) => {
    const table = createTable(1, 3);
    for (const [column, cell] of table.children[0]!.children.entries())
      cell.children = [createParagraph([createText(`${column}甲乙`, { bold: true })])];
    const host = renderEditor(createDocument([table]), { clipboardFormat: "html" });
    const anchor = { path: [0, 0, 1, 0, 0], offset: 1 };
    const focus = { path: [0, 0, 2, 0, 0], offset: 2 };
    select(
      host.container,
      backward ? { anchor: focus, focus: anchor } : { anchor, focus },
    );
    const copied = clipboard(host.container, "copy");
    expect(copied.data["text/plain"]).toBe("甲乙\t2甲");
    const expected = createTable(1, 2);
    expected.children[0]!.children[0]!.children = [
      createParagraph([createText("甲乙", { bold: true })]),
    ];
    expected.children[0]!.children[1]!.children = [
      createParagraph([createText("2甲", { bold: true })]),
    ];
    expect(parseHtml(copied.data["text/html"]!)?.blocks).toEqual([expected]);
    expect(host.onChange).not.toHaveBeenCalled();
    expect(host.onSelectionChange).not.toHaveBeenCalled();
    expect(host.onTransaction).not.toHaveBeenCalled();
  });

  it("copies complete rows from a readonly controlled editor without commands", () => {
    const table = createTable(2, 2);
    for (const row of table.children)
      for (const cell of row.children)
        cell.children = [createParagraph([createText("文字")])];
    const value = createDocument([table]);
    const host = renderEditor(value, {
      value,
      contentEditable: false,
      clipboardFormat: "html",
      commandRegistry: createCommandRegistry([]),
    });
    select(host.container, {
      anchor: { path: [0, 0, 0, 0, 0], offset: 0 },
      focus: { path: [0, 1, 1, 0, 0], offset: 2 },
    });
    const copied = clipboard(host.container, "copy");
    expect(parseHtml(copied.data["text/html"]!)?.blocks).toEqual([table]);
    expect(copied.data["text/plain"]).toBe("文字\t文字\n文字\t文字");
    expect(host.onChange).not.toHaveBeenCalled();
    expect(host.onTransaction).not.toHaveBeenCalled();
  });
});

describe("RichTextEditor plain clipboard copy", () => {
  it("supports readonly controlled values without using a command registry", () => {
    const value = createDocument([createParagraph([createText("前甲乙后")])]);
    const host = renderEditor(value, { value, contentEditable: false });
    select(host.container);
    expect(clipboard(host.container, "copy").data).toEqual({ "text/plain": "甲乙" });
    expect(host.onTransaction).not.toHaveBeenCalled();
  });

  it("lets the host cancel and completely own clipboard contents", () => {
    const onCopy = vi.fn((event) => {
      event.clipboardData.setData("text/html", "<b>宿主</b>");
      event.preventDefault();
    });
    const host = renderEditor(undefined, { onCopy });
    select(host.container);
    const result = clipboard(host.container, "copy");
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(result.data).toEqual({ "text/html": "<b>宿主</b>" });
    expect(result.clearData).not.toHaveBeenCalled();
  });

  it("does not read a different editor or a range partly outside its root", () => {
    const first = renderEditor();
    const second = renderEditor();
    select(second.container);
    expect(clipboard(first.container, "copy").setData).not.toHaveBeenCalled();
    const start =
      first.container.querySelector("p span")?.firstChild ??
      first.container.querySelector('[data-crucialy-path="[0,0]"]')!.firstChild!;
    const end = second.container.querySelector(
      '[data-crucialy-path="[0,0]"]',
    )!.firstChild!;
    window.getSelection()!.setBaseAndExtent(start, 1, end, 3);
    expect(clipboard(first.container, "copy").setData).not.toHaveBeenCalled();
    expect(first.onTransaction).not.toHaveBeenCalled();
  });

  it("reads model text rather than externally modified rendered text", () => {
    const host = renderEditor();
    host.container.querySelector(
      '[data-crucialy-path="[0,0]"]',
    )!.firstChild!.textContent = "前错误后";
    select(host.container);
    expect(clipboard(host.container, "copy").data).toEqual({ "text/plain": "甲乙" });
  });

  it("does not export an unfinished composition", () => {
    const host = renderEditor();
    select(host.container);
    act(() =>
      host.container.firstElementChild!.dispatchEvent(
        new CompositionEvent("compositionstart", { bubbles: true }),
      ),
    );
    expect(clipboard(host.container, "copy").setData).not.toHaveBeenCalled();
    expect(host.onTransaction).not.toHaveBeenCalled();
  });

  it("contains clipboard write failures without changing the model", () => {
    const host = renderEditor();
    select(host.container);
    const result = clipboard(host.container, "copy", true);
    expect(result.event.defaultPrevented).toBe(true);
    expect(result.data).toEqual({});
    expect(host.onChange).not.toHaveBeenCalled();
    expect(host.onTransaction).not.toHaveBeenCalled();
  });

  it("copies model text without changing the document or publishing a transaction", () => {
    const host = renderEditor();
    select(host.container);
    const { event, data } = clipboard(host.container, "copy");
    expect(event.defaultPrevented).toBe(true);
    expect(data).toEqual({ "text/plain": "甲乙" });
    expect(host.container.textContent).toBe("前甲乙后");
    expect(host.onChange).not.toHaveBeenCalled();
    expect(host.onSelectionChange).not.toHaveBeenCalled();
    expect(host.onTransaction).not.toHaveBeenCalled();
  });

  it("reads backward selections and does not emit rich HTML", () => {
    const host = renderEditor(
      createDocument([
        createParagraph([
          createText("甲", { bold: true }),
          createText("乙", { italic: true }),
        ]),
      ]),
    );
    select(host.container, {
      anchor: { path: [0, 1], offset: 1 },
      focus: { path: [0, 0], offset: 0 },
    });
    expect(clipboard(host.container, "copy").data).toEqual({ "text/plain": "甲乙" });
  });

  it("keeps collapsed selections on the browser default path", () => {
    const host = renderEditor();
    select(host.container, {
      anchor: { path: [0, 0], offset: 1 },
      focus: { path: [0, 0], offset: 1 },
    });
    const result = clipboard(host.container, "copy");
    expect(result.event.defaultPrevented).toBe(false);
    expect(result.setData).not.toHaveBeenCalled();
  });
});

describe("RichTextEditor plain clipboard cut", () => {
  it("does not delete when writing to the clipboard fails", () => {
    const host = renderEditor();
    select(host.container);
    const result = clipboard(host.container, "cut", true);
    expect(result.event.defaultPrevented).toBe(true);
    expect(result.data).toEqual({});
    expect(host.container.textContent).toBe("前甲乙后");
    expect(host.onChange).not.toHaveBeenCalled();
    expect(host.onTransaction).not.toHaveBeenCalled();
  });

  it.each(["missing", "disabled", "throw", "empty"])(
    "does not write or mutate for a %s deletion command",
    (mode) => {
      const commandRegistry = createCommandRegistry(
        mode === "missing"
          ? []
          : [
              {
                ...deleteSelectionCommand,
                canExecute: () => mode !== "disabled",
                execute: () => {
                  if (mode === "throw") throw new Error("Host deletion failed.");
                  return createCommandSuccess(deleteSelectionCommand.name, {
                    transaction: createTransaction(),
                    selection: {
                      anchor: { path: [0, 0], offset: 1 },
                      focus: { path: [0, 0], offset: 1 },
                    },
                  });
                },
              },
            ],
      );
      const host = renderEditor(undefined, { commandRegistry });
      select(host.container);
      const result = clipboard(host.container, "cut");
      expect(result.event.defaultPrevented).toBe(true);
      expect(result.setData).not.toHaveBeenCalled();
      expect(host.container.textContent).toBe("前甲乙后");
      expect(host.onTransaction).not.toHaveBeenCalled();
    },
  );

  it("lets a host cut handler own the event before the registry runs", () => {
    const execute = vi.fn(deleteSelectionCommand.execute);
    const onCut = vi.fn((event) => event.preventDefault());
    const host = renderEditor(undefined, {
      commandRegistry: createCommandRegistry([{ ...deleteSelectionCommand, execute }]),
      onCut,
    });
    select(host.container);
    expect(clipboard(host.container, "cut").setData).not.toHaveBeenCalled();
    expect(onCut).toHaveBeenCalledTimes(1);
    expect(execute).not.toHaveBeenCalled();
  });

  it("does not turn readonly cut into an edit", () => {
    const host = renderEditor(undefined, { contentEditable: false });
    select(host.container);
    const result = clipboard(host.container, "cut");
    expect(result.event.defaultPrevented).toBe(false);
    expect(result.setData).not.toHaveBeenCalled();
    expect(host.onTransaction).not.toHaveBeenCalled();
  });

  it("blocks native cut during composition without deleting or exporting preedit text", () => {
    const host = renderEditor();
    select(host.container);
    act(() =>
      host.container.firstElementChild!.dispatchEvent(
        new CompositionEvent("compositionstart", { bubbles: true }),
      ),
    );
    const result = clipboard(host.container, "cut");
    expect(result.event.defaultPrevented).toBe(true);
    expect(result.setData).not.toHaveBeenCalled();
    expect(host.onChange).not.toHaveBeenCalled();
  });

  it("does not use another editor's selection for cut", () => {
    const first = renderEditor();
    const second = renderEditor();
    select(second.container);
    const result = clipboard(first.container, "cut");
    expect(result.event.defaultPrevented).toBe(true);
    expect(result.setData).not.toHaveBeenCalled();
    expect(first.onTransaction).not.toHaveBeenCalled();
    expect(second.onTransaction).not.toHaveBeenCalled();
  });

  it("copies cross-cell text but refuses to cut the unsupported structural range", () => {
    const table = createTable(1, 2);
    for (const cell of table.children[0]!.children)
      cell.children = [createParagraph([createText("文字")])];
    const host = renderEditor(createDocument([table]));
    select(host.container, {
      anchor: { path: [0, 0, 0, 0, 0], offset: 1 },
      focus: { path: [0, 0, 1, 0, 0], offset: 1 },
    });
    expect(clipboard(host.container, "copy").data).toEqual({ "text/plain": "字\t文" });
    const result = clipboard(host.container, "cut");
    expect(result.event.defaultPrevented).toBe(true);
    expect(result.setData).not.toHaveBeenCalled();
    expect(host.container.querySelectorAll("td")).toHaveLength(2);
    expect(host.container.textContent).toBe("文字文字");
    expect(host.onChange).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    "cuts through deleteSelection once (backward: %s)",
    (backward) => {
      const host = renderEditor();
      const selection: RangeSelection = {
        anchor: { path: [0, 0], offset: backward ? 3 : 1 },
        focus: { path: [0, 0], offset: backward ? 1 : 3 },
      };
      select(host.container, selection);
      const result = clipboard(host.container, "cut");
      expect(result.event.defaultPrevented).toBe(true);
      expect(result.data).toEqual({ "text/plain": "甲乙" });
      expect(host.container.textContent).toBe("前后");
      expect(host.onChange).toHaveBeenCalledTimes(1);
      expect(host.onTransaction).toHaveBeenCalledTimes(1);
      expect(host.onTransaction.mock.calls[0]?.[0]).toMatchObject({
        inputType: "deleteByCut",
        before: host.value,
        beforeSelection: selection,
        selection: {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [0, 0], offset: 1 },
        },
        transaction: { operations: [{ type: "delete_text" }] },
      });
      expect(host.onTransaction.mock.calls[0]?.[0].batch).toBeUndefined();
    },
  );

  it("emits changes but does not replace a controlled value until the host accepts it", () => {
    const value = createDocument([createParagraph([createText("前甲乙后")])]);
    const host = renderEditor(value, { value });
    select(host.container);
    expect(clipboard(host.container, "cut").data).toEqual({ "text/plain": "甲乙" });
    expect(host.onChange).toHaveBeenCalledTimes(1);
    expect(host.onChange.mock.calls[0]?.[0]).toEqual(
      createDocument([createParagraph([createText("前后")])]),
    );
    expect(host.container.textContent).toBe("前甲乙后");
  });
});

describe("RichTextEditor opt-in HTML clipboard", () => {
  it.each(["copy", "cut"] as const)(
    "keeps the model intact when the HTML write fails during %s",
    (type) => {
      const host = renderEditor(undefined, { clipboardFormat: "html" });
      select(host.container);
      const result = clipboard(host.container, type, "text/html");
      expect(result.event.defaultPrevented).toBe(true);
      expect(result.data).toEqual({ "text/plain": "甲乙" });
      expect(host.container.textContent).toBe("前甲乙后");
      expect(host.onChange).not.toHaveBeenCalled();
      expect(host.onTransaction).not.toHaveBeenCalled();
    },
  );

  it("copies same-row HTML and still refuses cross-cell cut", () => {
    const table = createTable(1, 2);
    for (const cell of table.children[0]!.children)
      cell.children = [createParagraph([createText("文字")])];
    const host = renderEditor(createDocument([table]), { clipboardFormat: "html" });
    select(host.container, {
      anchor: { path: [0, 0, 0, 0, 0], offset: 1 },
      focus: { path: [0, 0, 1, 0, 0], offset: 1 },
    });
    const copied = clipboard(host.container, "copy");
    expect(copied.data["text/plain"]).toBe("字\t文");
    expect(copied.data["text/html"]).toContain("<table>");
    expect(clipboard(host.container, "cut").setData).not.toHaveBeenCalled();
    expect(host.onTransaction).not.toHaveBeenCalled();
  });

  it("respects a missing delete command before exporting rich clipboard data", () => {
    const host = renderEditor(undefined, {
      clipboardFormat: "html",
      commandRegistry: createCommandRegistry([]),
    });
    select(host.container);
    expect(clipboard(host.container, "cut").setData).not.toHaveBeenCalled();
    expect(host.container.textContent).toBe("前甲乙后");
  });

  it("lets host cancellation bypass HTML export", () => {
    const onCopy = vi.fn((event) => event.preventDefault());
    const host = renderEditor(undefined, { clipboardFormat: "html", onCopy });
    select(host.container);
    expect(clipboard(host.container, "copy").setData).not.toHaveBeenCalled();
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it("keeps explicit plain mode compatible even when the selection has marks", () => {
    const host = renderEditor(
      createDocument([createParagraph([createText("前甲乙后", { code: true })])]),
      { clipboardFormat: "plain" },
    );
    select(host.container);
    expect(clipboard(host.container, "copy").data).toEqual({ "text/plain": "甲乙" });
  });

  it.each([true, false])(
    "writes both formats without a transaction when editable is %s",
    (contentEditable) => {
      const host = renderEditor(
        createDocument([createParagraph([createText("前甲乙后", { bold: true })])]),
        { clipboardFormat: "html", contentEditable },
      );
      select(host.container);
      expect(clipboard(host.container, "copy").data).toEqual({
        "text/plain": "甲乙",
        "text/html": "<p><strong>甲乙</strong></p>",
      });
      expect(host.onChange).not.toHaveBeenCalled();
      expect(host.onTransaction).not.toHaveBeenCalled();
    },
  );

  it("cuts once after both formats are written", () => {
    const host = renderEditor(
      createDocument([createParagraph([createText("前甲乙后", { italic: true })])]),
      { clipboardFormat: "html" },
    );
    select(host.container);
    expect(clipboard(host.container, "cut").data).toEqual({
      "text/plain": "甲乙",
      "text/html": "<p><em>甲乙</em></p>",
    });
    expect(host.onTransaction).toHaveBeenCalledTimes(1);
    expect(host.onTransaction.mock.calls[0]?.[0].inputType).toBe("deleteByCut");
    expect(host.container.textContent).toBe("前后");
  });
});
