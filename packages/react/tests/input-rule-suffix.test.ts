// @vitest-environment jsdom
import {
  createDocument,
  createParagraph,
  createText,
  isListNode,
} from "@crucialy-rich/core";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";
vi.hoisted(() =>
  Object.defineProperty(window, "TextEvent", { configurable: true, value: InputEvent }),
);
describe("React input rule suffixes", () => {
  for (const controlled of [false, true]) {
    it.each(["#", ">", "-", "1.", "``"])(
      `keeps suffix for %s, controlled ${controlled}`,
      (prefix) => {
        const value = createDocument([
          createParagraph([createText(prefix + "正文😀")]),
        ]);
        const host = mountDeletionEditor(
          value,
          { path: [0, 0], offset: prefix.length },
          controlled ? { value } : {},
        );
        act(() =>
          host.editor.dispatchEvent(
            new InputEvent("textInput", {
              data: prefix === "``" ? "`" : " ",
              bubbles: true,
              cancelable: true,
            }),
          ),
        );
        expect(host.onTransaction).toHaveBeenCalledTimes(1);
        const event = host.onTransaction.mock.calls[0]![0];
        expect(event.inputType).toBe("insertFromInputRule");
        const block = event.after.children[0]!;
        const children = isListNode(block)
          ? block.children[0]!.children
          : block.children;
        expect(children.map((node) => ("text" in node ? node.text : "")).join("")).toBe(
          "正文😀",
        );
        expect(host.ref.current!.getDocument()).toEqual(
          controlled ? value : event.after,
        );
      },
    );
  }
  it.each(["canceled", "readonly", "composing"])(
    "keeps the source unchanged when %s",
    (mode) => {
      const value = createDocument([createParagraph([createText("-正文")])]);
      const host = mountDeletionEditor(
        value,
        { path: [0, 0], offset: 1 },
        {
          contentEditable: mode !== "readonly",
          ...(mode === "canceled"
            ? { onBeforeInput: (event) => event.preventDefault() }
            : {}),
        },
      );
      if (mode === "composing") host.compose("compositionstart");
      act(() =>
        host.editor.dispatchEvent(
          new InputEvent("textInput", { data: " ", bubbles: true, cancelable: true }),
        ),
      );
      expect(host.onTransaction).not.toHaveBeenCalled();
      expect(host.ref.current!.getDocument()).toEqual(value);
    },
  );
});
