// @vitest-environment jsdom
import {
  createDocument,
  createParagraph,
  createText,
  createImage,
  createBlockSelection,
  createDefaultCommandRegistry,
  createHistoryState,
  createHistorySnapshot,
  recordHistory,
  undoHistory,
} from "@crucialy-rich/core";
import { describe, expect, it, vi } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

describe.each(["deleteContentBackward", "deleteContentForward"])(
  "selected image native %s",
  (type) => {
    it("deletes only the selected image without a DOM Range and saves its block selection", () => {
      const before = createDocument([
        createParagraph([createText("保留文字")]),
        createImage("https://example.com/a.png"),
      ]);
      const clear = vi.fn();
      const host = mountDeletionEditor(before, undefined, {
        blockSelection: createBlockSelection([1]),
        onBlockSelectionChange: clear,
      });
      window.getSelection()!.removeAllRanges();
      expect(host.nativeInput(type).defaultPrevented).toBe(true);
      expect(host.editor.textContent).toBe("保留文字");
      expect(host.editor.querySelector("img")).toBeNull();
      expect(clear).toHaveBeenCalledExactlyOnceWith(undefined);
      const event = host.onTransaction.mock.calls[0]![0];
      expect(event.inputType).toBe("deleteImage");
      expect(event).not.toHaveProperty("beforeSelection");
      expect(event.beforeBlockSelection).toEqual(createBlockSelection([1]));
      const history = recordHistory({
        history: createHistoryState(),
        transaction: event.transaction,
        before: createHistorySnapshot(
          event.before,
          event.beforeSelection,
          event.beforeBlockSelection,
        ),
        after: createHistorySnapshot(event.after, event.selection),
      });
      expect(history.undoStack).toHaveLength(1);
      expect(undoHistory(history)!.document).toEqual(before);
      expect(undoHistory(history)!.blockSelection).toEqual(createBlockSelection([1]));
    });

    it.each(["disabled", "throw"])(
      "does not fall back to stale text if image deletion is %s",
      (mode) => {
        const registry = createDefaultCommandRegistry();
        registry.register({
          ...registry.get("deleteImage")!,
          canExecute() {
            if (mode === "throw") throw new Error("Image guard failed.");
            return false;
          },
        });
        const clear = vi.fn();
        const host = mountDeletionEditor(
          createDocument([
            createParagraph([createText("原文")]),
            createImage("https://example.com/a.png"),
          ]),
          { path: [0, 0], offset: 1 },
          {
            blockSelection: createBlockSelection([1]),
            commandRegistry: registry,
            onBlockSelectionChange: clear,
          },
        );
        host.nativeInput(type);
        expect(host.editor.textContent).toBe("原文");
        expect(host.editor.querySelector("img")).not.toBeNull();
        expect(host.onTransaction).not.toHaveBeenCalled();
        expect(clear).not.toHaveBeenCalled();
      },
    );

    it("repairs an image-only document with one paragraph transaction", () => {
      const host = mountDeletionEditor(
        createDocument([createImage("https://example.com/a.png")]),
        undefined,
        { blockSelection: createBlockSelection([0]) },
      );
      window.getSelection()!.removeAllRanges();
      host.nativeInput(type);
      expect(host.ref.current!.getDocument()).toEqual(createDocument());
      expect(host.onTransaction).toHaveBeenCalledTimes(1);
      expect(host.onTransaction.mock.calls[0]![0].selection.anchor).toEqual({
        path: [0, 0],
        offset: 0,
      });
    });
  },
);
