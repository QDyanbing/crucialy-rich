// @vitest-environment jsdom
import {
  createDocument,
  createParagraph,
  createCodeBlock,
  createText,
} from "@crucialy-rich/core";
import { describe, expect, it } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

describe("native insertLineBreak", () => {
  it.each([0, 1, 2])("inserts a literal LF without block splitting at %s", (offset) => {
    const host = mountDeletionEditor(
      createDocument([createParagraph([createText("AB", { italic: true })])]),
      { path: [0, 0], offset },
    );
    expect(host.nativeInput("insertLineBreak").defaultPrevented).toBe(true);
    expect(host.ref.current!.getDocument()).toEqual(
      createDocument([
        createParagraph([
          createText("AB".slice(0, offset) + "\n" + "AB".slice(offset), {
            italic: true,
          }),
        ]),
      ]),
    );
    const event = host.onTransaction.mock.calls[0]![0];
    expect(event.inputType).toBe("insertLineBreak");
    expect(event).not.toHaveProperty("batch");
    expect(event.selection.anchor.offset).toBe(offset + 1);
  });

  it.each([false, true])(
    "replaces a range with LF in one transaction (%s)",
    (reverse) => {
      const host = mountDeletionEditor(
        createDocument([createParagraph([createText("ABCD")])]),
        { path: [0, 0], offset: 1 },
      );
      const text = host.editor.querySelector("span")!.firstChild!;
      window
        .getSelection()!
        .setBaseAndExtent(text, reverse ? 3 : 1, text, reverse ? 1 : 3);
      host.nativeInput("insertLineBreak");
      expect(host.editor.textContent).toBe("A\nD");
      expect(
        host.onTransaction.mock.calls[0]![0].transaction.operations.map(
          (operation: { type: string }) => operation.type,
        ),
      ).toEqual(["delete_text", "insert_text"]);
    },
  );

  it("uses the input intent rather than arbitrary event data and keeps UTF-16 offsets", () => {
    const host = mountDeletionEditor(
      createDocument([createParagraph([createText("A\u{1f600}B")])]),
      { path: [0, 0], offset: 3 },
    );
    host.nativeInput("insertLineBreak", { data: "not a line break" });
    expect(host.editor.textContent).toBe("A\u{1f600}\nB");
    expect(host.onTransaction.mock.calls[0]![0].selection.anchor.offset).toBe(4);
  });

  it("does not exit code even after two literal line breaks", () => {
    const host = mountDeletionEditor(
      createDocument([createCodeBlock([createText("A\n")])]),
      { path: [0, 0], offset: 2 },
    );
    host.nativeInput("insertLineBreak");
    expect(host.ref.current!.getDocument()).toEqual(
      createDocument([createCodeBlock([createText("A\n\n")])]),
    );
  });
});
