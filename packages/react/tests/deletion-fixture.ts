import { type DocumentNode, type Point } from "@crucialy-rich/core";
import { act, createElement, createRef } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, vi } from "vitest";
import {
  RichTextEditor,
  type RichTextEditorHandle,
  type RichTextEditorProps,
} from "../src";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const roots: ReturnType<typeof createRoot>[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) act(() => root.unmount());
  window.getSelection()!.removeAllRanges();
  document.body.replaceChildren();
});

export function mountDeletionEditor(
  value: DocumentNode,
  point: Point | undefined,
  options: Partial<RichTextEditorProps> = {},
) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  const ref = createRef<RichTextEditorHandle>();
  const onChange = vi.fn(),
    onTransaction = vi.fn(),
    onSelectionChange = vi.fn();
  act(() =>
    root.render(
      createElement(RichTextEditor, {
        contentEditable: true,
        defaultValue: value,
        ref,
        onChange,
        onTransaction,
        onSelectionChange,
        ...options,
      }),
    ),
  );
  const editor = ref.current!.getElement()!;
  editor.focus();
  function setCaret(next: Point) {
    const text = editor.querySelector(
      `[data-crucialy-path="${JSON.stringify(next.path)}"]`,
    )!.firstChild!;
    window.getSelection()!.setBaseAndExtent(text, next.offset, text, next.offset);
  }
  if (point) setCaret(point);
  return {
    ref,
    editor,
    onChange,
    onTransaction,
    onSelectionChange,
    setCaret,
    nativeInput(inputType: string, extra: InputEventInit = {}) {
      const event = new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        inputType,
        ...extra,
      });
      act(() => editor.dispatchEvent(event));
      return event;
    },
    press(key: string, extra: KeyboardEventInit = {}) {
      const event = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key,
        ...extra,
      });
      act(() => editor.dispatchEvent(event));
      return event;
    },
  };
}
