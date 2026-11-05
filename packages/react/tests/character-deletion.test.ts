// @vitest-environment jsdom
import {
  createDocument,
  createParagraph,
  createText,
  isValidPoint,
} from "@crucialy-rich/core";
import { describe, expect, it } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

describe.each(["Backspace", "Delete"])("%s grapheme keyboard events", (key) => {
  it.each(["\u{1f600}", "e\u0301", "\u{1f44d}\u{1f3fd}", "\u{1f469}\u200d\u{1f4bb}"])(
    "publishes one model transaction for %s",
    (cluster) => {
      const document = createDocument([createParagraph([createText(`A${cluster}B`)])]);
      const point = {
        path: [0, 0],
        offset: key === "Backspace" ? 1 + cluster.length : 1,
      };
      const host = mountDeletionEditor(document, point);
      expect(host.press(key).defaultPrevented).toBe(true);
      expect(host.editor.textContent).toBe("AB");
      expect(host.onChange).toHaveBeenCalledTimes(1);
      expect(host.onTransaction).toHaveBeenCalledTimes(1);
      const event = host.onTransaction.mock.calls[0]![0];
      expect(event.before).toEqual(document);
      expect(event.beforeSelection).toEqual({ anchor: point, focus: point });
      expect(event.inputType).toBe(
        key === "Backspace" ? "deleteBackward" : "deleteForward",
      );
      expect(event.transaction.operations).toHaveLength(1);
      expect(event.transaction.operations[0].type).toBe("delete_text");
      expect(event).not.toHaveProperty("batch");
      expect(event.selection.anchor).toEqual({ path: [0, 0], offset: 1 });
      expect(
        isValidPoint(host.ref.current!.getDocument(), event.selection.anchor),
      ).toBe(true);
    },
  );

  it("deletes a grapheme across marks and preserves unselected link metadata", () => {
    const document = createDocument([
      createParagraph([
        createText("Ae", { bold: true }),
        createText("\u0301", { italic: true }),
        createText("B", { link: { href: "https://example.com/", target: "_blank" } }),
      ]),
      createParagraph([createText("邻段")]),
    ]);
    const host = mountDeletionEditor(
      document,
      key === "Backspace" ? { path: [0, 1], offset: 1 } : { path: [0, 0], offset: 1 },
    );
    host.press(key);
    expect(host.editor.querySelector("p")!.textContent).toBe("AB");
    expect(host.editor.querySelectorAll("p")).toHaveLength(2);
    expect(host.editor.querySelector("a")!.getAttribute("href")).toBe(
      "https://example.com/",
    );
    expect(host.ref.current!.getDocument().children[1]).toEqual(document.children[1]);
    const selection = host.onSelectionChange.mock.calls.at(-1)![0];
    expect(isValidPoint(host.ref.current!.getDocument(), selection.anchor)).toBe(true);
  });
});
