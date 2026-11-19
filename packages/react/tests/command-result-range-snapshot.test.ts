// @vitest-environment jsdom
import {
  BOLD_COMMAND_NAME,
  createCommandRegistry,
  createCommandSuccess,
  createDocument,
  createInsertTextOperation,
  createParagraph,
  createText,
  createTransaction,
  type CommandResult,
  type RangeSelection,
} from "@crucialy-rich/core";
import { act } from "react";
import { describe, expect, it } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

const range = (): RangeSelection => ({
  anchor: { path: [0, 0], offset: 0 },
  focus: { path: [0, 0], offset: 2 },
});
describe("command result range snapshots", () => {
  it.each(["ref", "shortcut"])(
    "captures %s result ranges before invoking onChange",
    (route) => {
      let result: CommandResult | undefined;
      const registry = createCommandRegistry([
        {
          name: BOLD_COMMAND_NAME,
          execute(input) {
            result = createCommandSuccess(BOLD_COMMAND_NAME, {
              selection: input.context.selection!,
              transaction: createTransaction([
                createInsertTextOperation({ path: [0, 0], offset: 0 }, "X"),
              ]),
            });
            return result;
          },
        },
      ]);
      const host = mountDeletionEditor(
        createDocument([createParagraph([createText("原始文字")])]),
        undefined,
        {
          selection: range(),
          commandRegistry: registry,
          onChange() {
            result!.selection!.anchor.offset = 99;
            result!.selection!.focus.path[0] = 99;
          },
        },
      );
      const text = host.editor.querySelector(
        '[data-crucialy-path="[0,0]"]',
      )!.firstChild!;
      window.getSelection()!.setBaseAndExtent(text, 0, text, 2);
      if (route === "ref")
        act(() => host.ref.current!.executeCommand(BOLD_COMMAND_NAME));
      else host.press("b", { ctrlKey: true });
      expect(host.onTransaction.mock.calls[0]![0].beforeSelection).toEqual(range());
      expect(host.onTransaction.mock.calls[0]![0].selection).toEqual(range());
      expect(host.onSelectionChange).toHaveBeenCalledWith(range());
      result!.selection!.focus.offset = 88;
      expect(host.onTransaction.mock.calls[0]![0].selection).toEqual(range());
    },
  );
});
