// @vitest-environment jsdom
import {
  createDocument,
  createParagraph,
  createText,
  createDefaultCommandRegistry,
} from "@crucialy-rich/core";
import { describe, expect, it, vi } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

describe.each(["insertParagraph", "insertLineBreak"])(
  "native %s listener lifecycle",
  (type) => {
    const value = () => createDocument([createParagraph([createText("AB")])]);
    const point = { path: [0, 0], offset: 1 };

    it("submits once in StrictMode and lets the latest policy cancel subsequent intents", () => {
      const observe = vi.fn();
      const host = mountDeletionEditor(
        value(),
        point,
        { onNativeBeforeInput: observe },
        true,
      );
      host.nativeInput(type);
      expect(observe).toHaveBeenCalledTimes(1);
      expect(host.onTransaction).toHaveBeenCalledTimes(1);
      const cancel = vi.fn((event: InputEvent) => event.preventDefault());
      host.rerender({ onNativeBeforeInput: cancel });
      host.nativeInput(type);
      expect(cancel).toHaveBeenCalledTimes(1);
      expect(observe).toHaveBeenCalledTimes(1);
      expect(host.onTransaction).toHaveBeenCalledTimes(1);
    });

    it("uses a replacement command Registry instead of stale event policy", () => {
      const host = mountDeletionEditor(value(), point);
      const registry = createDefaultCommandRegistry();
      const name = type === "insertParagraph" ? "splitBlock" : "insertText";
      registry.register({ ...registry.get(name)!, canExecute: () => false });
      host.rerender({ commandRegistry: registry });
      host.nativeInput(type);
      expect(host.onTransaction).not.toHaveBeenCalled();
    });

    it("cleans up its listener on unmount", () => {
      const policy = vi.fn();
      const host = mountDeletionEditor(value(), point, { onNativeBeforeInput: policy });
      host.unmount();
      host.nativeInput(type);
      expect(policy).not.toHaveBeenCalled();
      expect(host.onTransaction).not.toHaveBeenCalled();
    });

    it("does not borrow another editor's range", () => {
      const first = mountDeletionEditor(value(), point);
      const second = mountDeletionEditor(value(), point);
      expect(first.nativeInput(type).defaultPrevented).toBe(true);
      expect(first.onTransaction).not.toHaveBeenCalled();
      second.nativeInput(type);
      expect(second.onTransaction).toHaveBeenCalledTimes(1);
      expect(first.editor.textContent).toBe("AB");
    });
  },
);
