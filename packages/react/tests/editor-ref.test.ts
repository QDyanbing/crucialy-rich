// @vitest-environment jsdom

import {
  BOLD_COMMAND_NAME,
  createDocument,
  createParagraph,
  createText,
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
