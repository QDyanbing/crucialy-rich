// @vitest-environment jsdom
import {
  applyTransaction,
  BOLD_COMMAND_NAME,
  CLEAR_FORMATTING_COMMAND_NAME,
  createDefaultCommandRegistry,
  createDocument,
  createParagraph,
  createText,
  executeCommand,
  INLINE_CODE_COMMAND_NAME,
  INSERT_TEXT_COMMAND_NAME,
  ITALIC_COMMAND_NAME,
  SET_HEADING_COMMAND_NAME,
  SET_LINK_COMMAND_NAME,
  STRIKE_COMMAND_NAME,
  TOGGLE_QUOTE_COMMAND_NAME,
  UNDERLINE_COMMAND_NAME,
  UNSET_LINK_COMMAND_NAME,
} from "@crucialy-rich/core";
import { act } from "react";
import { describe, expect, it } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

const commands = [
  { name: BOLD_COMMAND_NAME },
  { name: ITALIC_COMMAND_NAME },
  { name: UNDERLINE_COMMAND_NAME },
  { name: STRIKE_COMMAND_NAME },
  { name: INLINE_CODE_COMMAND_NAME },
  { name: CLEAR_FORMATTING_COMMAND_NAME },
  { name: SET_LINK_COMMAND_NAME, payload: { href: "https://example.com/new" } },
  { name: UNSET_LINK_COMMAND_NAME },
  { name: SET_HEADING_COMMAND_NAME, payload: { level: 2 } },
  { name: TOGGLE_QUOTE_COMMAND_NAME },
  { name: INSERT_TEXT_COMMAND_NAME, payload: { text: "替换" } },
];

for (const controlled of [false, true]) {
  for (const reverse of [false, true]) {
    describe(`ref command integration controlled ${controlled}, reverse ${reverse}`, () => {
      it.each(commands)(
        "bridges $name through one transaction",
        ({ name, payload }) => {
          const value = createDocument([
            createParagraph([
              createText("命令正文", {
                bold: true,
                italic: true,
                link: { href: "https://example.com/original" },
              }),
            ]),
          ]);
          const first = { path: [0, 0], offset: 0 },
            last = { path: [0, 0], offset: 2 };
          const selection = {
            anchor: reverse ? last : first,
            focus: reverse ? first : last,
          };
          const expected = executeCommand(createDefaultCommandRegistry(), name, {
            context: { document: value, selection },
            ...(payload ? { payload } : {}),
          });
          expect(expected.ok).toBe(true);
          const after = applyTransaction(value, expected.transaction!);
          const host = mountDeletionEditor(value, undefined, {
            selection,
            ...(controlled ? { value } : {}),
          });
          window.getSelection()!.removeAllRanges();
          act(() =>
            expect(host.ref.current!.executeCommand(name, payload).ok).toBe(true),
          );
          expect(host.onChange).toHaveBeenCalledTimes(1);
          expect(host.onChange).toHaveBeenCalledWith(after);
          expect(host.onTransaction).toHaveBeenCalledTimes(1);
          expect(host.onTransaction.mock.calls[0]![0]).toMatchObject({
            before: value,
            after,
            beforeSelection: selection,
            selection: expected.selection,
            inputType: "command",
          });
          expect(host.onSelectionChange).toHaveBeenCalledTimes(1);
          expect(host.ref.current!.getDocument()).toEqual(controlled ? value : after);
          if (controlled) {
            host.rerender({ value: after, selection: expected.selection! });
            expect(host.ref.current!.getDocument()).toEqual(after);
          }
        },
      );
    });
  }
}
