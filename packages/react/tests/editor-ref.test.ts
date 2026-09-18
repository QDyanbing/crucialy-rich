// @vitest-environment jsdom

import {
  BOLD_COMMAND_NAME,
  createDocument,
  createParagraph,
  createText,
  type DocumentNode,
} from "@crucialy-rich/core";
import { act, createElement, createRef } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RichTextEditor, type RichTextEditorHandle } from "../src";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const roots: ReturnType<typeof createRoot>[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) {
    act(() => root.unmount());
  }

  document.body.replaceChildren();
});

describe("RichTextEditor ref", () => {
  it("exposes the current element document selection and focus", () => {
    const container = document.createElement("div");
    const editorRef = createRef<RichTextEditorHandle>();
    const value = createDocument([createParagraph([createText("可聚焦文档")])]);
    const selection = {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 3 },
    };
    const root = createRoot(container);

    roots.push(root);
    document.body.append(container);

    act(() => {
      root.render(
        createElement(RichTextEditor, {
          contentEditable: true,
          ref: editorRef,
          selection,
          value,
        }),
      );
    });

    expect(editorRef.current?.getElement()).toBe(container.firstElementChild);
    expect(editorRef.current?.getDocument()).toBe(value);
    expect(editorRef.current?.getSelection()).toEqual(selection);

    act(() => editorRef.current?.focus());

    expect(document.activeElement).toBe(editorRef.current?.getElement());
  });

  it("executes commands against an uncontrolled document", () => {
    const container = document.createElement("div");
    const editorRef = createRef<RichTextEditorHandle>();
    const handleChange = vi.fn();
    const handleTransaction = vi.fn();
    const selection = {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 2 },
    };
    const root = createRoot(container);

    roots.push(root);
    document.body.append(container);

    act(() => {
      root.render(
        createElement(RichTextEditor, {
          contentEditable: true,
          defaultValue: createDocument([createParagraph([createText("命令文档")])]),
          onChange: handleChange,
          onTransaction: handleTransaction,
          ref: editorRef,
          selection,
        }),
      );
    });

    act(() => {
      expect(editorRef.current?.executeCommand(BOLD_COMMAND_NAME).ok).toBe(true);
    });

    expect(editorRef.current?.getDocument().children[0]).toMatchObject({
      children: [{ marks: { bold: true }, text: "命令" }, { text: "文档" }],
    });
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ inputType: "command" }),
    );
  });
});

describe("RichTextEditor integration modes", () => {
  it("waits for the host to update a controlled value", () => {
    const container = document.createElement("div");
    const editorRef = createRef<RichTextEditorHandle>();
    const initialValue = createDocument([createParagraph([createText("受控文档")])]);
    const selection = {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 2 },
    };
    let nextValue: DocumentNode | undefined;
    const handleChange = vi.fn((value: DocumentNode) => {
      nextValue = value;
    });
    const root = createRoot(container);

    roots.push(root);
    document.body.append(container);

    act(() => {
      root.render(
        createElement(RichTextEditor, {
          contentEditable: true,
          onChange: handleChange,
          ref: editorRef,
          selection,
          value: initialValue,
        }),
      );
    });
    act(() => {
      editorRef.current?.executeCommand(BOLD_COMMAND_NAME);
    });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(editorRef.current?.getDocument()).toBe(initialValue);
    expect(container.querySelector("strong")).toBeNull();

    const controlledValue = nextValue;

    if (!controlledValue) {
      throw new Error("Controlled editor did not emit the next document.");
    }

    act(() => {
      root.render(
        createElement(RichTextEditor, {
          contentEditable: true,
          onChange: handleChange,
          ref: editorRef,
          selection,
          value: controlledValue,
        }),
      );
    });

    expect(container.querySelector("strong")?.textContent).toBe("受控");
  });

  it("reads defaultValue only when uncontrolled state initializes", () => {
    const container = document.createElement("div");
    const editorRef = createRef<RichTextEditorHandle>();
    const initialValue = createDocument([createParagraph([createText("初始内容")])]);
    const replacement = createDocument([createParagraph([createText("后续默认值")])]);
    const root = createRoot(container);

    roots.push(root);

    act(() => {
      root.render(
        createElement(RichTextEditor, {
          defaultValue: initialValue,
          ref: editorRef,
        }),
      );
    });
    act(() => {
      root.render(
        createElement(RichTextEditor, {
          defaultValue: replacement,
          ref: editorRef,
        }),
      );
    });

    expect(editorRef.current?.getDocument()).toBe(initialValue);
    expect(container.textContent).toBe("初始内容");
  });

  it("ignores keyboard editing while readonly", () => {
    const container = document.createElement("div");
    const handleChange = vi.fn();
    const root = createRoot(container);

    roots.push(root);

    act(() => {
      root.render(
        createElement(RichTextEditor, {
          contentEditable: false,
          onChange: handleChange,
          value: createDocument([createParagraph([createText("只读内容")])]),
        }),
      );
    });

    const editor = container.firstElementChild;

    act(() => {
      editor?.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "Backspace" }),
      );
    });

    expect(editor?.getAttribute("aria-readonly")).toBe("true");
    expect(editor?.getAttribute("contenteditable")).toBe("false");
    expect(handleChange).not.toHaveBeenCalled();
    expect(container.textContent).toBe("只读内容");
  });
});
