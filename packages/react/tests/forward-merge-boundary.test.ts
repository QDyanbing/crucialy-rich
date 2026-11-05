// @vitest-environment jsdom
import {
  createDefaultCommandRegistry,
  createDocument,
  createParagraph,
  createText,
} from "@crucialy-rich/core";
import { describe, expect, it, vi } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

function document() {
  return createDocument([
    createParagraph([createText("A", { bold: true }), createText("\u{1f600}B")]),
    createParagraph([createText("next")]),
  ]);
}

describe("Delete at formatted leaf boundaries", () => {
  it("deletes the next grapheme instead of merging the next paragraph", () => {
    const host = mountDeletionEditor(document(), { path: [0, 0], offset: 1 });
    expect(host.press("Delete").defaultPrevented).toBe(true);
    expect(host.editor.querySelectorAll("p")).toHaveLength(2);
    expect(host.editor.querySelector("p")!.textContent).toBe("AB");
    expect(host.onTransaction.mock.calls[0]![0].transaction.operations[0].type).toBe(
      "delete_text",
    );
  });

  it("does not consult an unrelated failing merge extension in the middle of text", () => {
    const registry = createDefaultCommandRegistry();
    const guard = vi.fn(() => {
      throw new Error("Unexpected merge.");
    });
    registry.register({ ...registry.get("mergeBlock")!, canExecute: guard });
    const host = mountDeletionEditor(
      document(),
      { path: [0, 0], offset: 1 },
      { commandRegistry: registry },
    );
    host.press("Delete");
    expect(guard).not.toHaveBeenCalled();
    expect(host.editor.querySelector("p")!.textContent).toBe("AB");
  });

  it("still merges at the true paragraph end with the original caret in History", () => {
    const host = mountDeletionEditor(document(), { path: [0, 1], offset: 3 });
    host.press("Delete");
    expect(host.editor.querySelectorAll("p")).toHaveLength(1);
    expect(host.editor.textContent).toBe("A\u{1f600}Bnext");
    const event = host.onTransaction.mock.calls[0]![0];
    expect(event.transaction.operations[0].type).toBe("merge_block");
    expect(event.beforeSelection.anchor).toEqual({ path: [0, 1], offset: 3 });
  });
});
