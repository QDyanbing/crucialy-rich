// @vitest-environment jsdom
import { createDocument, createParagraph, createText } from "@crucialy-rich/core";
import { describe, expect, it, vi } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

describe("native beforeinput observation", () => {
  it.each([
    "insertText",
    "deleteContentBackward",
    "deleteContentForward",
    "historyUndo",
  ])("passes the original %s event to the host before model handling", (inputType) => {
    const callback = vi.fn((event: InputEvent) => {
      expect(event.currentTarget).toBe(host.editor);
      expect(event.target).toBe(host.editor);
      event.preventDefault();
    });
    const host = mountDeletionEditor(
      createDocument([createParagraph([createText("AB")])]),
      { path: [0, 0], offset: 1 },
      { onNativeBeforeInput: callback },
    );
    const event = host.nativeInput(inputType, {
      data: inputType === "insertText" ? "新" : null,
    });
    expect(callback).toHaveBeenCalledExactlyOnceWith(event);
    expect(event.defaultPrevented).toBe(true);
    expect(host.onTransaction).not.toHaveBeenCalled();
    expect(host.editor.textContent).toBe("AB");
    expect(host.editor.hasAttribute("onNativeBeforeInput")).toBe(false);
  });

  it("observes native input even while readonly", () => {
    const callback = vi.fn();
    const host = mountDeletionEditor(
      createDocument([createParagraph([createText("AB")])]),
      { path: [0, 0], offset: 1 },
      { contentEditable: false, onNativeBeforeInput: callback },
    );
    const event = host.nativeInput("deleteContentBackward");
    expect(callback).toHaveBeenCalledExactlyOnceWith(event);
    expect(host.onTransaction).not.toHaveBeenCalled();
  });
});
