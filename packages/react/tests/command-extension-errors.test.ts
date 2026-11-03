// @vitest-environment jsdom
import {
  createBlockSelection,
  createDefaultCommandRegistry,
  createDocument,
  createImage,
  createParagraph,
  createText,
  type CommandRegistry,
} from "@crucialy-rich/core";
import { act, createElement, createRef } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RichTextEditor, type RichTextEditorHandle } from "../src";

vi.hoisted(() =>
  Object.defineProperty(window, "TextEvent", { configurable: true, value: InputEvent }),
);
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const roots: ReturnType<typeof createRoot>[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) act(() => root.unmount());
  window.getSelection()!.removeAllRanges();
  document.body.replaceChildren();
});

function mount(registry: CommandRegistry, image = false) {
  const value = createDocument([
    createParagraph([createText("前甲乙后")]),
    image
      ? createImage("https://example.com/a.png")
      : createParagraph([createText("第二段")]),
  ]);
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  const onChange = vi.fn(),
    onSelectionChange = vi.fn(),
    onTransaction = vi.fn(),
    onBlockSelectionChange = vi.fn();
  const ref = createRef<RichTextEditorHandle>();
  act(() =>
    root.render(
      createElement(RichTextEditor, {
        defaultValue: value,
        contentEditable: true,
        clipboardFormat: "html",
        commandRegistry: registry,
        ...(image ? { blockSelection: createBlockSelection([1]) } : {}),
        onChange,
        onSelectionChange,
        onTransaction,
        onBlockSelectionChange,
        ref,
      }),
    ),
  );
  const editor = container.firstElementChild as HTMLElement;
  editor.focus();
  const text = editor.querySelector("span")!.firstChild!;
  window.getSelection()!.setBaseAndExtent(text, 1, text, 3);
  return {
    editor,
    value,
    ref,
    onChange,
    onSelectionChange,
    onTransaction,
    onBlockSelectionChange,
  };
}

function broken(name: string, stage: string) {
  const registry = createDefaultCommandRegistry();
  const original = registry.get(name)!;
  const execute = vi.fn(() => {
    throw new Error("Extension execution failed.");
  });
  registry.register({
    ...original,
    canExecute: () => {
      if (stage === "guard") throw new Error("Extension guard failed.");
      return stage !== "disabled";
    },
    execute,
  });
  return {
    registry:
      stage === "lookup"
        ? {
            ...registry,
            get: () => {
              throw new Error("Lookup failed.");
            },
          }
        : registry,
    execute,
  };
}

describe("React command exception boundaries", () => {
  it.each(["Backspace", "Delete"])(
    "respects a disabled range delete command for %s",
    (key) => {
      const extension = broken("deleteSelection", "disabled");
      const host = mount(extension.registry);
      const event = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key,
      });
      act(() => host.editor.dispatchEvent(event));
      expect(event.defaultPrevented).toBe(true);
      expect(extension.execute).not.toHaveBeenCalled();
      expect(host.onTransaction).not.toHaveBeenCalled();
      expect(host.editor.textContent).toBe("前甲乙后第二段");
    },
  );

  it("records the actual source caret before a successful forward merge", () => {
    const host = mount(createDefaultCommandRegistry());
    const text = host.editor.querySelector("span")!.firstChild!;
    window.getSelection()!.setBaseAndExtent(text, 4, text, 4);
    act(() =>
      host.editor.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          cancelable: true,
          key: "Delete",
        }),
      ),
    );
    expect(host.onTransaction).toHaveBeenCalledTimes(1);
    expect(host.onTransaction.mock.calls[0]![0].beforeSelection).toEqual({
      anchor: { path: [0, 0], offset: 4 },
      focus: { path: [0, 0], offset: 4 },
    });
    expect(host.editor.textContent).toBe("前甲乙后第二段");
  });
  for (const stage of ["guard", "execute", "lookup"]) {
    it.each([
      ["cut", "deleteSelection"],
      ["paste", "paste"],
      ["shortcut", "bold"],
      ["Enter", "splitBlock"],
      ["Backspace", "deleteSelection"],
      ["Delete", "deleteSelection"],
      ["ref", "insertText"],
      ["input", "insertText"],
    ])(`keeps document and History untouched for %s (${stage})`, (action, name) => {
      const extension = broken(name!, stage);
      const host = mount(extension.registry);
      const setData = vi.fn();
      let event: Event | undefined;
      act(() => {
        if (action === "ref") {
          expect(
            host.ref.current!.executeCommand("insertText", { text: "新" }).status,
          ).toBe("failure");
        } else if (action === "cut" || action === "paste") {
          event = new Event(action, { bubbles: true, cancelable: true });
          Object.defineProperty(event, "clipboardData", {
            value: {
              types: ["text/plain"],
              getData: () => "新",
              clearData: vi.fn(),
              setData,
            },
          });
          host.editor.dispatchEvent(event);
        } else if (action === "input") {
          event = new InputEvent("textInput", {
            bubbles: true,
            cancelable: true,
            data: "新",
          });
          host.editor.dispatchEvent(event);
        } else {
          event = new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            key: action === "shortcut" ? "b" : action,
            ctrlKey: action === "shortcut",
          });
          host.editor.dispatchEvent(event);
        }
      });
      if (event) expect(event.defaultPrevented).toBe(true);
      expect(setData).not.toHaveBeenCalled();
      expect(host.editor.textContent).toBe("前甲乙后第二段");
      expect(host.onChange).not.toHaveBeenCalled();
      expect(host.onSelectionChange).not.toHaveBeenCalled();
      expect(host.onTransaction).not.toHaveBeenCalled();
    });
  }

  it.each(["Backspace", "Delete"])(
    "does not delete stale text after selected image %s fails",
    (key) => {
      const host = mount(broken("deleteImage", "guard").registry, true);
      const event = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key,
      });
      act(() => host.editor.dispatchEvent(event));
      expect(event.defaultPrevented).toBe(true);
      expect(host.editor.querySelector("img")).not.toBeNull();
      expect(host.editor.textContent).toBe("前甲乙后");
      expect(host.onTransaction).not.toHaveBeenCalled();
      expect(host.onBlockSelectionChange).not.toHaveBeenCalled();
    },
  );

  it.each(["Backspace", "Delete"])(
    "does not fall back after collapsed merge %s fails",
    (key) => {
      const host = mount(broken("mergeBlock", "guard").registry);
      const text =
        host.editor.querySelectorAll("span")[key === "Backspace" ? 1 : 0]!.firstChild!;
      const offset = key === "Backspace" ? 0 : 4;
      window.getSelection()!.setBaseAndExtent(text, offset, text, offset);
      const event = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key,
      });
      act(() => host.editor.dispatchEvent(event));
      expect(event.defaultPrevented).toBe(true);
      expect(host.editor.textContent).toBe("前甲乙后第二段");
      expect(host.onTransaction).not.toHaveBeenCalled();
    },
  );
});
