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
import type { RichTextEditorTransactionEvent } from "../src";
import { mountDeletionEditor } from "./deletion-fixture";

describe("editor range notification ownership", () => {
  for (const route of [
    "ref",
    "shortcut",
    "enter",
    "nativeEnter",
    "delete",
    "composition",
  ]) {
    it.each(["transaction", "selection"])(
      `isolates ${route} %s callback ranges`,
      (mutator) => {
        const selection: RangeSelection = {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 2 },
        };
        const original = structuredClone(selection);
        let received: RichTextEditorTransactionEvent | undefined;
        let expected: RangeSelection | undefined;
        let notified: RangeSelection | undefined;
        const host = mountDeletionEditor(
          createDocument([createParagraph([createText("通知正文")])]),
          undefined,
          {
            selection,
            onTransaction(event) {
              received = event;
              expected = structuredClone(event.selection);
              if (mutator === "transaction") {
                event.selection.anchor.path[0] = 99;
                event.selection.focus.offset = 99;
                if (event.beforeSelection) event.beforeSelection.anchor.offset = 99;
              }
            },
            onSelectionChange(next) {
              notified = structuredClone(next);
              if (mutator === "selection") {
                next.anchor.offset = 99;
                next.focus.path[0] = 99;
              }
            },
          },
        );
        const text = host.editor.querySelector(
          '[data-crucialy-path="[0,0]"]',
        )!.firstChild!;
        window.getSelection()!.setBaseAndExtent(text, 0, text, 2);
        if (route === "ref")
          act(() => host.ref.current!.executeCommand(BOLD_COMMAND_NAME));
        else if (route === "shortcut") host.press("b", { ctrlKey: true });
        else if (route === "enter") host.press("Enter");
        else if (route === "nativeEnter") host.nativeInput("insertParagraph");
        else if (route === "delete") host.press("Backspace");
        else {
          host.compose("compositionstart");
          host.compose("compositionend", "字");
        }
        expect(received).toBeDefined();
        expect(notified).toEqual(expected);
        expect(selection).toEqual(original);
        if (mutator === "selection") expect(received!.selection).toEqual(expected);
        expect(host.onChange).toHaveBeenCalledTimes(1);
      },
    );
  }
});
