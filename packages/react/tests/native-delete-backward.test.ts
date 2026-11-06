// @vitest-environment jsdom
import { createDocument, createParagraph, createText } from "@crucialy-rich/core";
import { describe, expect, it } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

describe("native deleteContentBackward", () => {
  it.each(["\u{1f600}", "e\u0301", "\u{1f469}\u200d\u{1f4bb}", "\u{1f1e8}\u{1f1f3}"])(
    "deletes a whole %s without keydown",
    (cluster) => {
      const host = mountDeletionEditor(
        createDocument([createParagraph([createText(`A${cluster}B`)])]),
        { path: [0, 0], offset: 1 + cluster.length },
      );
      expect(host.nativeInput("deleteContentBackward").defaultPrevented).toBe(true);
      expect(host.editor.textContent).toBe("AB");
      expect(host.onTransaction).toHaveBeenCalledTimes(1);
      const event = host.onTransaction.mock.calls[0]![0];
      expect(event.inputType).toBe("deleteBackward");
      expect(event.transaction.operations).toHaveLength(1);
      expect(event.selection.anchor.offset).toBe(1);
      expect(event).not.toHaveProperty("batch");
    },
  );

  it.each([false, true])(
    "deletes a supported cross-paragraph range (backward: %s)",
    (backward) => {
      const host = mountDeletionEditor(
        createDocument([
          createParagraph([createText("前甲")]),
          createParagraph([createText("乙后")]),
        ]),
        { path: [0, 0], offset: 1 },
      );
      const nodes = host.editor.querySelectorAll("span");
      window
        .getSelection()!
        .setBaseAndExtent(
          nodes[backward ? 1 : 0]!.firstChild!,
          1,
          nodes[backward ? 0 : 1]!.firstChild!,
          1,
        );
      host.nativeInput("deleteContentBackward");
      expect(host.editor.textContent).toBe("前后");
      expect(host.onTransaction).toHaveBeenCalledTimes(1);
      expect(host.onTransaction.mock.calls[0]![0].transaction.operations[0].type).toBe(
        "delete_range",
      );
    },
  );

  it("merges only at a real paragraph start", () => {
    const host = mountDeletionEditor(
      createDocument([
        createParagraph([createText("前")]),
        createParagraph([createText("后")]),
      ]),
      { path: [1, 0], offset: 0 },
    );
    host.nativeInput("deleteContentBackward");
    expect(host.editor.querySelectorAll("p")).toHaveLength(1);
    expect(host.editor.textContent).toBe("前后");
    expect(host.onTransaction.mock.calls[0]![0].beforeSelection.anchor.path).toEqual([
      1, 0,
    ]);
  });

  it("cancels the browser mutation but records no history at the document start", () => {
    const host = mountDeletionEditor(
      createDocument([createParagraph([createText("原文")])]),
      { path: [0, 0], offset: 0 },
    );
    expect(host.nativeInput("deleteContentBackward").defaultPrevented).toBe(true);
    expect(host.onTransaction).not.toHaveBeenCalled();
    expect(host.editor.textContent).toBe("原文");
  });
});
