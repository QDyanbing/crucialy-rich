// @vitest-environment jsdom
import {
  createDocument,
  createParagraph,
  createTaskItem,
  createTaskList,
  createText,
  createHistorySnapshot,
  createHistoryState,
  recordHistory,
  undoHistory,
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
  window.getSelection()!.removeAllRanges();
  document.body.replaceChildren();
});
const value = createDocument([createParagraph([createText("甲😀乙", { bold: true })])]);

function mount(model: DocumentNode = value) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  const onChange = vi.fn();
  const onTransaction = vi.fn();
  act(() =>
    root.render(
      createElement(RichTextEditor, {
        defaultValue: model,
        contentEditable: true,
        clipboardFormat: "html",
        onChange,
        onTransaction,
      }),
    ),
  );
  const editor = container.firstElementChild as HTMLDivElement;
  editor.focus();
  return { editor, onChange, onTransaction };
}

function dispatch(editor: HTMLElement, type: "copy" | "cut") {
  const data: Record<string, string> = {};
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", {
    value: {
      clearData: () => {
        for (const key of Object.keys(data)) delete data[key];
      },
      setData: (mime: string, value: string) => {
        data[mime] = value;
      },
    },
  });
  act(() => editor.dispatchEvent(event));
  return { data, event };
}

describe("React clipboard DOM boundaries", () => {
  for (const action of ["copy", "cut"] as const) {
    it.each([false, true])(
      `${action} uses full text for leaf element endpoints (%s)`,
      (backward) => {
        const host = mount();
        const leaf = host.editor.querySelector("strong")!;
        window
          .getSelection()!
          .setBaseAndExtent(leaf, backward ? 1 : 0, leaf, backward ? 0 : 1);
        const result = dispatch(host.editor, action);
        expect(result.event.defaultPrevented).toBe(true);
        expect(result.data).toEqual({
          "text/plain": "甲😀乙",
          "text/html": "<p><strong>甲😀乙</strong></p>",
        });
        if (action === "copy") {
          expect(host.onTransaction).not.toHaveBeenCalled();
          expect(host.editor.textContent).toBe("甲😀乙");
        } else {
          expect(host.editor.textContent).toBe("");
          const event = host.onTransaction.mock.calls[0]![0];
          expect(event.beforeSelection.anchor.offset).toBe(backward ? 4 : 0);
          expect(event.beforeSelection.focus.offset).toBe(backward ? 0 : 4);
          const history = recordHistory({
            history: createHistoryState(),
            transaction: event.transaction,
            before: createHistorySnapshot(event.before, event.beforeSelection),
            after: createHistorySnapshot(event.after, event.selection),
          });
          const undone = undoHistory(history)!;
          expect(undone.document).toEqual(value);
          expect(undone.selection).toEqual(event.beforeSelection);
        }
      },
    );

    it(`${action} maps a fragmented text suffix without losing its prefix offset`, () => {
      const host = mount();
      const leaf = host.editor.querySelector("strong")!;
      const suffix = (leaf.firstChild as Text).splitText(1);
      window.getSelection()!.setBaseAndExtent(suffix, 0, leaf, 2);
      const result = dispatch(host.editor, action);
      expect(result.data["text/plain"]).toBe("😀乙");
      expect(result.data["text/html"]).toBe("<p><strong>😀乙</strong></p>");
      expect(host.editor.textContent).toBe(action === "cut" ? "甲" : "甲😀乙");
      expect(value.children[0]!.children[0]!.text).toBe("甲😀乙");
    });

    it(`${action} treats the task checkbox as a control rather than text`, () => {
      const model = createDocument([
        createTaskList([createTaskItem([createText("任务")], true)]),
      ]);
      const host = mount(model);
      const item = host.editor.querySelector("li")!;
      window.getSelection()!.setBaseAndExtent(item, 0, item, 2);
      const result = dispatch(host.editor, action);
      expect(result.data["text/plain"]).toBe("任务");
      expect(result.data["text/html"]).toBe("<p><span>任务</span></p>");
      expect(host.editor.querySelector("input")!.checked).toBe(true);
      expect(host.editor.textContent).toBe(action === "cut" ? "" : "任务");
    });

    it(`${action} refuses a checkbox endpoint instead of editing stale text`, () => {
      const host = mount(
        createDocument([createTaskList([createTaskItem([createText("任务")], true)])]),
      );
      const control = host.editor.querySelector("input")!;
      const text = host.editor.querySelector("span")!.firstChild!;
      window.getSelection()!.setBaseAndExtent(control, 0, text, 1);
      expect(dispatch(host.editor, action).data).toEqual({});
      expect(host.onTransaction).not.toHaveBeenCalled();
      expect(host.editor.textContent).toBe("任务");
    });
  }
});
