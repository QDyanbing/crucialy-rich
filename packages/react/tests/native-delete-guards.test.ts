// @vitest-environment jsdom
import { createDocument, createParagraph, createText } from "@crucialy-rich/core";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

describe.each(["deleteContentBackward", "deleteContentForward"])(
  "native %s protections",
  (type) => {
    it.each(["readonly", "host", "composition", "native-composition", "noncancelable"])(
      "respects %s before model edits",
      (mode) => {
        const observe = vi.fn((event: InputEvent) => {
          if (mode === "host") event.preventDefault();
        });
        const host = mountDeletionEditor(
          createDocument([createParagraph([createText("A\u{1f600}B")])]),
          { path: [0, 0], offset: 2 },
          { contentEditable: mode !== "readonly", onNativeBeforeInput: observe },
        );
        if (mode === "composition")
          act(() =>
            host.editor.dispatchEvent(
              new CompositionEvent("compositionstart", { bubbles: true }),
            ),
          );
        const event = host.nativeInput(type, {
          cancelable: mode !== "noncancelable",
          isComposing: mode === "native-composition",
        });
        expect(observe).toHaveBeenCalledExactlyOnceWith(event);
        expect(host.onTransaction).not.toHaveBeenCalled();
        expect(host.editor.textContent).toBe("A\u{1f600}B");
      },
    );

    it("cancels a supported intent with no owned DOM range without borrowing props", () => {
      const caret = { path: [0, 0], offset: 1 };
      const host = mountDeletionEditor(
        createDocument([createParagraph([createText("AB")])]),
        caret,
        { selection: { anchor: caret, focus: caret } },
      );
      window.getSelection()!.removeAllRanges();
      expect(host.nativeInput(type).defaultPrevented).toBe(true);
      expect(host.onTransaction).not.toHaveBeenCalled();
    });

    it.each(["input", "textarea", "button"])(
      "does not treat an embedded %s event as editor deletion",
      (tag) => {
        const host = mountDeletionEditor(
          createDocument([createParagraph([createText("AB")])]),
          { path: [0, 0], offset: 1 },
        );
        const child = document.createElement(tag);
        host.editor.append(child);
        const event = new InputEvent("beforeinput", {
          inputType: type,
          bubbles: true,
          cancelable: true,
        });
        act(() => child.dispatchEvent(event));
        expect(event.defaultPrevented).toBe(false);
        expect(host.onTransaction).not.toHaveBeenCalled();
      },
    );
  },
);

it.each(["deleteWordBackward", "deleteWordForward", "historyUndo", "insertFromDrop"])(
  "observes but does not reinterpret unsupported %s",
  (type) => {
    const observe = vi.fn();
    const host = mountDeletionEditor(
      createDocument([createParagraph([createText("AB")])]),
      { path: [0, 0], offset: 1 },
      { onNativeBeforeInput: observe },
    );
    expect(host.nativeInput(type).defaultPrevented).toBe(false);
    expect(observe).toHaveBeenCalledTimes(1);
    expect(host.onTransaction).not.toHaveBeenCalled();
  },
);
