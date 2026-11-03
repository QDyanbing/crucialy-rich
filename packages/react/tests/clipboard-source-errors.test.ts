// @vitest-environment jsdom
import { createDocument, createParagraph, createText } from "@crucialy-rich/core";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RichTextEditor, type RichTextEditorProps } from "../src";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const roots: ReturnType<typeof createRoot>[] = [];
const errors = vi.fn();
afterEach(() => {
  for (const root of roots.splice(0)) act(() => root.unmount());
  window.removeEventListener("error", errors);
  errors.mockClear();
  window.getSelection()!.removeAllRanges();
  document.body.replaceChildren();
});

function mount(props: Partial<RichTextEditorProps> = {}) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  const onChange = vi.fn();
  const onSelectionChange = vi.fn();
  const onTransaction = vi.fn();
  window.addEventListener("error", errors);
  act(() =>
    root.render(
      createElement(RichTextEditor, {
        defaultValue: createDocument([createParagraph([createText("前甲乙后")])]),
        contentEditable: true,
        onChange,
        onSelectionChange,
        onTransaction,
        ...props,
      }),
    ),
  );
  const editor = container.firstElementChild as HTMLElement;
  editor.tabIndex = 0;
  editor.focus();
  const text = editor.querySelector("span")!.firstChild!;
  window.getSelection()!.setBaseAndExtent(text, 1, text, 3);
  return { editor, onChange, onSelectionChange, onTransaction };
}

function paste(editor: HTMLElement, stage: string) {
  const getData = vi.fn((mime: string) => {
    if (stage === "plain-read" || (stage === "html-read" && mime === "text/html"))
      throw new Error("Data unavailable.");
    return "新";
  });
  const readTypes = vi.fn(() => {
    if (stage === "types") throw new Error("MIME unavailable.");
    if (stage === "iterator")
      return {
        [Symbol.iterator]() {
          throw new Error("MIME iterator failed.");
        },
      };
    return stage === "html-read" ? ["text/html", "text/plain"] : ["text/plain"];
  });
  const readData = vi.fn(() => {
    if (stage === "missing") return null;
    return {
      get types() {
        return readTypes();
      },
      getData,
    };
  });
  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", { get: readData });
  act(() => editor.dispatchEvent(event));
  return { event, getData, readTypes };
}

describe("React clipboard source exceptions", () => {
  it.each(["missing", "types", "iterator", "html-read", "plain-read"])(
    "keeps model and selection intact when %s is unavailable",
    (stage) => {
      const host = mount();
      const result = paste(host.editor, stage);
      expect(result.event.defaultPrevented).toBe(true);
      expect(errors).not.toHaveBeenCalled();
      expect(host.editor.textContent).toBe("前甲乙后");
      expect(host.onChange).not.toHaveBeenCalled();
      expect(host.onSelectionChange).not.toHaveBeenCalled();
      expect(host.onTransaction).not.toHaveBeenCalled();
      expect(window.getSelection()!.anchorOffset).toBe(1);
      expect(window.getSelection()!.focusOffset).toBe(3);
      if (stage === "html-read")
        expect(result.getData).toHaveBeenCalledExactlyOnceWith("text/html");
    },
  );

  it("does not read inaccessible data after host cancellation", () => {
    const host = mount({ onPaste: (event) => event.preventDefault() });
    expect(paste(host.editor, "types").readTypes).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
  });

  it("does not read inaccessible data in readonly mode", () => {
    const host = mount({ contentEditable: false });
    const result = paste(host.editor, "types");
    expect(result.event.defaultPrevented).toBe(false);
    expect(result.readTypes).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
  });

  it("accepts a later valid paste after a source failure", () => {
    const host = mount();
    paste(host.editor, "types");
    expect(host.onTransaction).not.toHaveBeenCalled();
    paste(host.editor, "valid");
    expect(host.editor.textContent).toBe("前新后");
    expect(host.onTransaction).toHaveBeenCalledTimes(1);
    expect(host.onTransaction.mock.calls[0]![0].inputType).toBe("insertFromPaste");
    expect(errors).not.toHaveBeenCalled();
  });
});
