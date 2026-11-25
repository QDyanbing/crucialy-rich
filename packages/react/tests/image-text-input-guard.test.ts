// @vitest-environment jsdom
import {
  createBlockSelection,
  createDocument,
  createImage,
  createParagraph,
  createText,
} from "@crucialy-rich/core";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";
vi.hoisted(() =>
  Object.defineProperty(window, "TextEvent", { configurable: true, value: InputEvent }),
);
const value = createDocument([
  createParagraph([createText("-正文")]),
  createImage("https://example.com/image.png"),
]);
describe("selected image text input ownership", () => {
  for (const controlled of [false, true]) {
    it.each(["X", " ", "# "])(
      `blocks text %j with controlled mode ${controlled}`,
      (data) => {
        const host = mountDeletionEditor(
          value,
          { path: [0, 0], offset: 1 },
          {
            blockSelection: createBlockSelection([1]),
            ...(controlled ? { value } : {}),
          },
        );
        const event = new InputEvent("textInput", {
          data,
          bubbles: true,
          cancelable: true,
        });
        act(() => host.editor.dispatchEvent(event));
        expect(event.defaultPrevented).toBe(true);
        expect(host.onChange).not.toHaveBeenCalled();
        expect(host.onTransaction).not.toHaveBeenCalled();
        expect(host.onSelectionChange).not.toHaveBeenCalled();
        expect(host.ref.current!.getDocument()).toEqual(value);
      },
    );
    it.each(["text/plain", "text/html"])(
      `does not parse %s while a block is selected, controlled ${controlled}`,
      (type) => {
        const host = mountDeletionEditor(
          value,
          { path: [0, 0], offset: 1 },
          {
            blockSelection: createBlockSelection([1]),
            ...(controlled ? { value } : {}),
          },
        );
        const getData = vi.fn(() => "替换");
        const event = new Event("paste", { bubbles: true, cancelable: true });
        Object.defineProperty(event, "clipboardData", {
          value: { types: [type], getData },
        });
        act(() => host.editor.dispatchEvent(event));
        expect(event.defaultPrevented).toBe(true);
        expect(getData).not.toHaveBeenCalled();
        expect(host.onTransaction).not.toHaveBeenCalled();
        expect(host.ref.current!.getDocument()).toEqual(value);
      },
    );
  }
  it("blocks native Space instead of editing the old text caret", () => {
    const host = mountDeletionEditor(
      value,
      { path: [0, 0], offset: 1 },
      { blockSelection: createBlockSelection([1]) },
    );
    const event = new window.KeyboardEvent("keypress", {
      key: " ",
      which: 32,
      charCode: 32,
      bubbles: true,
      cancelable: true,
    });
    act(() => host.editor.dispatchEvent(event));
    expect(event.defaultPrevented).toBe(true);
    expect(host.onTransaction).not.toHaveBeenCalled();
  });
});
