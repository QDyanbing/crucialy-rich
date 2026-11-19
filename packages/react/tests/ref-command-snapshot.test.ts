// @vitest-environment jsdom
import {
  BOLD_COMMAND_NAME,
  createCommandRegistry,
  createDefaultCommandRegistry,
  createDocument,
  createParagraph,
  createText,
  executeCommand,
  type RangeSelection,
} from "@crucialy-rich/core";
import { act } from "react";
import { describe, expect, it } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

const value = createDocument([createParagraph([createText("命令正文")])]);
const range = (): RangeSelection => ({
  anchor: { path: [0, 0], offset: 0 },
  focus: { path: [0, 0], offset: 3 },
});

describe("ref command input snapshots", () => {
  it.each(["guard", "execute"])(
    "isolates the controlled range and before snapshot from %s changes",
    (phase) => {
      const selection = range();
      const registry = createCommandRegistry([
        {
          name: "format",
          canExecute(input) {
            if (phase === "guard") {
              input.context.selection!.anchor.offset = 1;
              input.context.selection!.focus.offset = 2;
            }
            return true;
          },
          execute(input) {
            if (phase === "execute") {
              input.context.selection!.anchor.offset = 1;
              input.context.selection!.focus.offset = 2;
            }
            return executeCommand(
              createDefaultCommandRegistry(),
              BOLD_COMMAND_NAME,
              input,
            );
          },
        },
      ]);
      const host = mountDeletionEditor(value, undefined, {
        selection,
        commandRegistry: registry,
      });
      window.getSelection()!.removeAllRanges();
      act(() => expect(host.ref.current!.executeCommand("format").ok).toBe(true));
      expect(selection).toEqual(range());
      expect(host.onTransaction.mock.calls[0]![0].beforeSelection).toEqual(range());
      expect(host.editor.querySelector("strong")!.textContent).toBe("令");
    },
  );
  it("does not let a failing extension mutate the controlled range", () => {
    const selection = range();
    const registry = createCommandRegistry([
      {
        name: "fail",
        execute(input) {
          input.context.selection!.anchor.path[0] = 99;
          input.context.selection!.focus.offset = 99;
          throw new Error("extension failed");
        },
      },
    ]);
    const host = mountDeletionEditor(value, undefined, {
      selection,
      commandRegistry: registry,
    });
    window.getSelection()!.removeAllRanges();
    act(() => expect(host.ref.current!.executeCommand("fail").ok).toBe(false));
    expect(selection).toEqual(range());
    expect(host.onChange).not.toHaveBeenCalled();
    expect(host.onTransaction).not.toHaveBeenCalled();
  });
});
