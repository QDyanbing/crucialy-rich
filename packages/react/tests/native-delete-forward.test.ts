// @vitest-environment jsdom
import {
  createDocument,
  createParagraph,
  createText,
  createDivider,
  createImage,
} from "@crucialy-rich/core";
import { describe, expect, it } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

describe("native deleteContentForward", () => {
  it.each(["\u{1f600}", "\u{1f469}\u200d\u{1f4bb}"])(
    "deletes the whole next %s without keydown",
    (cluster) => {
      const host = mountDeletionEditor(
        createDocument([createParagraph([createText(`A${cluster}B`)])]),
        { path: [0, 0], offset: 1 },
      );
      expect(host.nativeInput("deleteContentForward").defaultPrevented).toBe(true);
      expect(host.editor.textContent).toBe("AB");
      expect(host.onTransaction).toHaveBeenCalledTimes(1);
      const event = host.onTransaction.mock.calls[0]![0];
      expect(event.inputType).toBe("deleteForward");
      expect(event.selection.anchor.offset).toBe(1);
      expect(event).not.toHaveProperty("batch");
    },
  );

  it("deletes across formatting instead of merging at an intermediate leaf end", () => {
    const host = mountDeletionEditor(
      createDocument([
        createParagraph([
          createText("Ae", { bold: true }),
          createText("\u0301", { italic: true }),
          createText("B"),
        ]),
        createParagraph([createText("邻段")]),
      ]),
      { path: [0, 0], offset: 1 },
    );
    host.nativeInput("deleteContentForward");
    expect(host.editor.querySelectorAll("p")).toHaveLength(2);
    expect(host.editor.querySelector("p")!.textContent).toBe("AB");
    expect(host.onTransaction.mock.calls[0]![0].transaction.operations[0].type).toBe(
      "delete_text",
    );
  });

  it.each([false, true])(
    "deletes explicit ranges without expanding endpoints (%s)",
    (backward) => {
      const host = mountDeletionEditor(
        createDocument([createParagraph([createText("Ae\u0301B")])]),
        { path: [0, 0], offset: 1 },
      );
      const text = host.editor.querySelector("span")!.firstChild!;
      window
        .getSelection()!
        .setBaseAndExtent(text, backward ? 2 : 1, text, backward ? 1 : 2);
      host.nativeInput("deleteContentForward");
      expect(host.editor.textContent).toBe("A\u0301B");
      expect(host.onTransaction).toHaveBeenCalledTimes(1);
    },
  );

  it("merges at the actual paragraph end and keeps the source caret", () => {
    const host = mountDeletionEditor(
      createDocument([
        createParagraph([createText("前", { bold: true }), createText("甲")]),
        createParagraph([createText("后")]),
      ]),
      { path: [0, 1], offset: 1 },
    );
    host.nativeInput("deleteContentForward");
    expect(host.editor.querySelectorAll("p")).toHaveLength(1);
    expect(host.editor.textContent).toBe("前甲后");
    expect(host.onTransaction.mock.calls[0]![0].beforeSelection.anchor).toEqual({
      path: [0, 1],
      offset: 1,
    });
  });

  it.each([createDivider(), createImage("https://example.com/a.png")])(
    "removes an adjacent $type using the existing void rule",
    (block) => {
      const host = mountDeletionEditor(
        createDocument([createParagraph([createText("前")]), block]),
        { path: [0, 0], offset: 1 },
      );
      host.nativeInput("deleteContentForward");
      expect(host.ref.current!.getDocument().children).toHaveLength(1);
      expect(host.onTransaction.mock.calls[0]![0].transaction.operations[0].type).toBe(
        "remove_block",
      );
    },
  );

  it("cancels mutation without creating a transaction at the final text end", () => {
    const host = mountDeletionEditor(
      createDocument([createParagraph([createText("原文")])]),
      { path: [0, 0], offset: 2 },
    );
    expect(host.nativeInput("deleteContentForward").defaultPrevented).toBe(true);
    expect(host.onTransaction).not.toHaveBeenCalled();
  });
});
