// @vitest-environment jsdom
import {
  createCommandRegistry,
  createCommandSuccess,
  createDocument,
  createParagraph,
  createText,
  type CommandInput,
  type RangeSelection,
} from "@crucialy-rich/core";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

const value = createDocument([createParagraph([createText("选区正文")])]);
const range = (): RangeSelection => ({
  anchor: { path: [0, 0], offset: 0 },
  focus: { path: [0, 0], offset: 2 },
});

describe("ref selection resolution", () => {
  it.each(["anchor", "focus"] as const)(
    "does not expose or pass an invalid controlled %s",
    (endpoint) => {
      const selection = range();
      selection[endpoint].offset = 99;
      const execute = vi.fn((input: CommandInput) =>
        createCommandSuccess(input.context.document === value ? "observe" : "other"),
      );
      const host = mountDeletionEditor(value, undefined, {
        selection,
        commandRegistry: createCommandRegistry([{ name: "observe", execute }]),
      });
      window.getSelection()!.removeAllRanges();
      expect(host.ref.current!.getSelection()).toBeUndefined();
      act(() => host.ref.current!.executeCommand("observe"));
      expect(execute.mock.calls[0]![0]).toEqual({ context: { document: value } });
      expect(host.onChange).not.toHaveBeenCalled();
    },
  );

  it("prefers a legal owned DOM caret to an invalid controlled fallback", () => {
    const selection = range();
    selection.focus.path = [99, 0];
    const host = mountDeletionEditor(value, { path: [0, 0], offset: 3 }, { selection });
    expect(host.ref.current!.getSelection()).toEqual({
      anchor: { path: [0, 0], offset: 3 },
      focus: { path: [0, 0], offset: 3 },
    });
  });

  it("uses only the explicit legal fallback when the browser range is elsewhere", () => {
    const selection = range();
    const host = mountDeletionEditor(value, undefined, { selection });
    const outside = document.createTextNode("外部文字");
    document.body.append(outside);
    window.getSelection()!.setBaseAndExtent(outside, 1, outside, 2);
    expect(host.ref.current!.getSelection()).toEqual(selection);
    host.rerender({ selection: undefined });
    expect(host.ref.current!.getSelection()).toBeUndefined();
  });
});
