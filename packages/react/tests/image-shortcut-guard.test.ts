// @vitest-environment jsdom
import {
  createBlockSelection,
  createDocument,
  createImage,
  createParagraph,
  createText,
  createCommandRegistry,
  BOLD_COMMAND_NAME,
  createCommandSuccess,
} from "@crucialy-rich/core";
import { describe, expect, it, vi } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";
const value = createDocument([
  createParagraph([createText("正文")]),
  createImage("https://example.com/image.png"),
]);
const keys = [
  { key: "b", ctrlKey: true },
  { key: "i", metaKey: true },
  { key: "u", ctrlKey: true },
  { key: "x", shiftKey: true, ctrlKey: true },
  { key: "2", ctrlKey: true, altKey: true },
  { key: "7", ctrlKey: true, shiftKey: true },
  { key: "8", ctrlKey: true, shiftKey: true },
  { key: "9", ctrlKey: true, shiftKey: true },
];
describe("selected image formatting shortcut ownership", () => {
  for (const controlled of [false, true]) {
    it.each(keys)(
      `does not format old text for $key, controlled ${controlled}`,
      ({ key, ...modifiers }) => {
        const blockChange = vi.fn();
        const host = mountDeletionEditor(
          value,
          { path: [0, 0], offset: 1 },
          {
            blockSelection: createBlockSelection([1]),
            onBlockSelectionChange: blockChange,
            ...(controlled ? { value } : {}),
          },
        );
        expect(host.press(key, modifiers).defaultPrevented).toBe(true);
        expect(host.ref.current!.getDocument()).toEqual(value);
        expect(host.onChange).not.toHaveBeenCalled();
        expect(host.onTransaction).not.toHaveBeenCalled();
        expect(blockChange).not.toHaveBeenCalled();
      },
    );
  }
  it("does not invoke an extension against the stale text range", () => {
    const execute = vi.fn(() => createCommandSuccess(BOLD_COMMAND_NAME));
    const host = mountDeletionEditor(
      value,
      { path: [0, 0], offset: 1 },
      {
        blockSelection: createBlockSelection([1]),
        commandRegistry: createCommandRegistry([{ name: BOLD_COMMAND_NAME, execute }]),
      },
    );
    host.press("b", { ctrlKey: true });
    expect(execute).not.toHaveBeenCalled();
  });
  it("keeps Delete available after refusing a format shortcut", () => {
    const host = mountDeletionEditor(
      value,
      { path: [0, 0], offset: 1 },
      { blockSelection: createBlockSelection([1]) },
    );
    host.press("b", { ctrlKey: true });
    host.press("Delete");
    expect(host.onTransaction).toHaveBeenCalledTimes(1);
    expect(host.ref.current!.getDocument().children).toEqual([value.children[0]]);
  });
});
