// @vitest-environment jsdom
import {
  createDocument,
  createParagraph,
  createCodeBlock,
  createText,
  createImage,
  createBlockSelection,
} from "@crucialy-rich/core";
import { describe, expect, it } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

describe("Shift+Enter soft line breaks", () => {
  it.each([0, 1, 2])(
    "inserts one LF without splitting the block at offset %s",
    (offset) => {
      const host = mountDeletionEditor(
        createDocument([createParagraph([createText("AB", { bold: true })])]),
        { path: [0, 0], offset },
      );
      expect(host.press("Enter", { shiftKey: true }).defaultPrevented).toBe(true);
      expect(host.ref.current!.getDocument()).toEqual(
        createDocument([
          createParagraph([
            createText("AB".slice(0, offset) + "\n" + "AB".slice(offset), {
              bold: true,
            }),
          ]),
        ]),
      );
      const event = host.onTransaction.mock.calls[0]![0];
      expect(event.inputType).toBe("insertLineBreak");
      expect(event).not.toHaveProperty("batch");
      expect(event.selection.anchor.offset).toBe(offset + 1);
    },
  );

  it.each([false, true])("replaces the exact range atomically (%s)", (reverse) => {
    const host = mountDeletionEditor(
      createDocument([createParagraph([createText("ABCD")])]),
      { path: [0, 0], offset: 1 },
    );
    const text = host.editor.querySelector("span")!.firstChild!;
    window
      .getSelection()!
      .setBaseAndExtent(text, reverse ? 3 : 1, text, reverse ? 1 : 3);
    host.press("Enter", { shiftKey: true });
    expect(host.editor.textContent).toBe("A\nD");
    expect(
      host.onTransaction.mock.calls[0]![0].transaction.operations.map(
        (operation: { type: string }) => operation.type,
      ),
    ).toEqual(["delete_text", "insert_text"]);
  });

  it("does not exit a code block ending with a LF", () => {
    const host = mountDeletionEditor(
      createDocument([createCodeBlock([createText("A\n")])]),
      { path: [0, 0], offset: 2 },
    );
    host.press("Enter", { shiftKey: true });
    expect(host.ref.current!.getDocument()).toEqual(
      createDocument([createCodeBlock([createText("A\n\n")])]),
    );
  });

  it("keeps ordinary Enter splitting behavior", () => {
    const host = mountDeletionEditor(
      createDocument([createParagraph([createText("AB")])]),
      { path: [0, 0], offset: 1 },
    );
    host.press("Enter");
    expect(host.editor.querySelectorAll("p")).toHaveLength(2);
    expect(host.onTransaction.mock.calls[0]![0].inputType).toBe("insertParagraph");
  });

  it("does not insert into stale text while an image block is selected", () => {
    const host = mountDeletionEditor(
      createDocument([
        createParagraph([createText("AB")]),
        createImage("https://example.com/a.png"),
      ]),
      { path: [0, 0], offset: 1 },
      { blockSelection: createBlockSelection([1]) },
    );
    host.press("Enter", { shiftKey: true });
    expect(host.onTransaction).not.toHaveBeenCalled();
    expect(host.editor.textContent).toBe("AB");
  });
});
