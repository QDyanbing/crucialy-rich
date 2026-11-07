// @vitest-environment jsdom
import {
  createDocument,
  createParagraph,
  createHeading,
  createQuote,
  createText,
} from "@crucialy-rich/core";
import { describe, expect, it } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

describe("native insertParagraph", () => {
  it.each([0, 1, 2])("splits without keydown at offset %s", (offset) => {
    const host = mountDeletionEditor(
      createDocument([createParagraph([createText("AB", { bold: true })])]),
      { path: [0, 0], offset },
    );
    expect(host.nativeInput("insertParagraph").defaultPrevented).toBe(true);
    expect(
      host.ref
        .current!.getDocument()
        .children.map((block) => block.children.map((node) => node.text).join("")),
    ).toEqual(["AB".slice(0, offset), "AB".slice(offset)]);
    const event = host.onTransaction.mock.calls[0]![0];
    expect(event.inputType).toBe("insertParagraph");
    expect(event).not.toHaveProperty("batch");
    expect(event.selection.anchor).toEqual({ path: [1, 0], offset: 0 });
    expect(
      event.transaction.operations.map((operation: { type: string }) => operation.type),
    ).toEqual(["split_block"]);
  });

  it("retains heading level and marks", () => {
    const host = mountDeletionEditor(
      createDocument([createHeading(3, [createText("AB", { italic: true })])]),
      { path: [0, 0], offset: 1 },
    );
    host.nativeInput("insertParagraph");
    expect(host.ref.current!.getDocument()).toEqual(
      createDocument([
        createHeading(3, [createText("A", { italic: true })]),
        createHeading(3, [createText("B", { italic: true })]),
      ]),
    );
  });

  it.each([false, true])(
    "deletes a supported range before splitting atomically (%s)",
    (reverse) => {
      const host = mountDeletionEditor(
        createDocument([
          createParagraph([createText("前甲")]),
          createParagraph([createText("乙后")]),
        ]),
        { path: [0, 0], offset: 1 },
      );
      const text = host.editor.querySelectorAll("span");
      window
        .getSelection()!
        .setBaseAndExtent(
          text[reverse ? 1 : 0]!.firstChild!,
          1,
          text[reverse ? 0 : 1]!.firstChild!,
          1,
        );
      host.nativeInput("insertParagraph");
      expect(host.ref.current!.getDocument()).toEqual(
        createDocument([
          createParagraph([createText("前")]),
          createParagraph([createText("后")]),
        ]),
      );
      expect(host.onTransaction).toHaveBeenCalledTimes(1);
      expect(
        host.onTransaction.mock.calls[0]![0].transaction.operations.map(
          (operation: { type: string }) => operation.type,
        ),
      ).toEqual(["delete_range", "split_block"]);
    },
  );

  it("exits an emptied quote through the existing Enter rule", () => {
    const host = mountDeletionEditor(
      createDocument([createQuote([createText("引用")])]),
      { path: [0, 0], offset: 0 },
    );
    const text = host.editor.querySelector("span")!.firstChild!;
    window.getSelection()!.setBaseAndExtent(text, 0, text, 2);
    host.nativeInput("insertParagraph");
    expect(host.ref.current!.getDocument()).toEqual(createDocument());
  });
});
