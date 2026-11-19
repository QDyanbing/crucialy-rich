// @vitest-environment jsdom
import {
  createBlockSelection,
  createCommandRegistry,
  createCommandSuccess,
  createDocument,
  createImage,
  createInsertBlockOperation,
  createParagraph,
  createText,
  createTransaction,
  DELETE_IMAGE_COMMAND_NAME,
} from "@crucialy-rich/core";
import { act } from "react";
import { describe, expect, it } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

describe("ref commands without an existing text range", () => {
  it("applies an explicit image deletion without inventing a before range", () => {
    const host = mountDeletionEditor(
      createDocument([createImage("https://example.com/image.png")]),
      undefined,
    );
    window.getSelection()!.removeAllRanges();
    act(() =>
      expect(
        host.ref.current!.executeCommand(DELETE_IMAGE_COMMAND_NAME, {
          selection: createBlockSelection([0]),
        }).ok,
      ).toBe(true),
    );
    expect(host.onChange).toHaveBeenCalledTimes(1);
    expect(host.onTransaction).toHaveBeenCalledTimes(1);
    expect(host.onTransaction.mock.calls[0]![0]).not.toHaveProperty("beforeSelection");
    expect(host.ref.current!.getDocument().children).toEqual([createParagraph()]);
  });

  it.each([false, true])(
    "commits a document-level extension in controlled mode %s",
    (controlled) => {
      const value = createDocument([createParagraph([createText("原文")])]);
      const point = { path: [1, 0], offset: 0 };
      const commandRegistry = createCommandRegistry([
        {
          name: "appendParagraph",
          execute: () =>
            createCommandSuccess("appendParagraph", {
              selection: { anchor: point, focus: { ...point, path: [...point.path] } },
              transaction: createTransaction([
                createInsertBlockOperation([1], createParagraph()),
              ]),
            }),
        },
      ]);
      const host = mountDeletionEditor(value, undefined, {
        commandRegistry,
        ...(controlled ? { value } : {}),
      });
      window.getSelection()!.removeAllRanges();
      act(() => host.ref.current!.executeCommand("appendParagraph"));
      expect(host.onChange).toHaveBeenCalledTimes(1);
      expect(host.onChange.mock.calls[0]![0].children).toHaveLength(2);
      expect(host.onTransaction.mock.calls[0]![0]).not.toHaveProperty(
        "beforeSelection",
      );
      expect(host.onSelectionChange).toHaveBeenCalledWith({
        anchor: point,
        focus: point,
      });
      expect(host.ref.current!.getDocument().children).toHaveLength(controlled ? 1 : 2);
    },
  );
});
