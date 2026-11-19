// @vitest-environment jsdom
import {
  BOLD_COMMAND_NAME,
  createDocument,
  createParagraph,
  createText,
  type RangeSelection,
} from "@crucialy-rich/core";
import { act } from "react";
import { describe, expect, it } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

const value = createDocument([createParagraph([createText("快照正文")])]);
const range = (): RangeSelection => ({
  anchor: { path: [0, 0], offset: 0 },
  focus: { path: [0, 0], offset: 2 },
});

describe("ref selection getter snapshots", () => {
  it.each(["DOM", "controlled"])(
    "returns an independent %s range on every read",
    (source) => {
      const selection = range();
      const host = mountDeletionEditor(value, undefined, { selection });
      if (source === "controlled") window.getSelection()!.removeAllRanges();
      const first = host.ref.current!.getSelection()!;
      const second = host.ref.current!.getSelection()!;
      first.anchor.path[0] = 99;
      first.focus.offset = 99;
      expect(second).toEqual(range());
      expect(selection).toEqual(range());
      expect(host.ref.current!.getSelection()).toEqual(range());
      act(() => host.ref.current!.executeCommand(BOLD_COMMAND_NAME));
      expect(host.editor.querySelector("strong")!.textContent).toBe("快照");
    },
  );
  it("does not let a retained getter snapshot alter later controlled updates", () => {
    const host = mountDeletionEditor(value, undefined, { selection: range() });
    window.getSelection()!.removeAllRanges();
    const previous = host.ref.current!.getSelection()!;
    const next = range();
    next.anchor.offset = 1;
    host.rerender({ selection: next });
    window.getSelection()!.removeAllRanges();
    previous.focus.path[0] = 99;
    expect(host.ref.current!.getSelection()).toEqual(next);
  });
});
