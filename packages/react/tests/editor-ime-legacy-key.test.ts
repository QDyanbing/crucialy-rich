// @vitest-environment jsdom
import { createDocument, createParagraph, createText } from "@crucialy-rich/core";
import { describe, expect, it, vi } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

describe("legacy IME key ownership", () => {
  it.each(["Enter", "Backspace", "Delete", "b"])(
    "does not process %s with keyCode 229",
    (key) => {
      const onKeyDown = vi.fn();
      const value = createDocument([createParagraph([createText("正文")])]);
      const host = mountDeletionEditor(
        value,
        { path: [0, 0], offset: 1 },
        { onKeyDown },
      );
      expect(
        host.press(key, { keyCode: 229, ctrlKey: key === "b" }).defaultPrevented,
      ).toBe(false);
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(host.onTransaction).not.toHaveBeenCalled();
      expect(host.ref.current!.getDocument()).toEqual(value);
      host.press("Backspace");
      expect(host.onTransaction).toHaveBeenCalledTimes(1);
    },
  );
});
