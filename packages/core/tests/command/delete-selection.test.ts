import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecuteDeleteSelectionCommand,
  createDocument,
  createParagraph,
  createText,
  deleteSelectionCommand,
} from "../../src";

describe("deleteSelectionCommand", () => {
  it("deletes a text range", () => {
    const document = createDocument([createParagraph([createText("你好旧内容")])]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 2 },
          focus: { path: [0, 0], offset: 5 },
        },
      },
    };
    const result = deleteSelectionCommand.execute(input);

    expect(canExecuteDeleteSelectionCommand(input)).toBe(true);
    expect(result).toMatchObject({
      commandName: "deleteSelection",
      ok: true,
      selection: {
        anchor: { path: [0, 0], offset: 2 },
        focus: { path: [0, 0], offset: 2 },
      },
      status: "success",
    });
    expect(result.transaction).toEqual({
      operations: [
        {
          range: {
            anchor: { path: [0, 0], offset: 2 },
            focus: { path: [0, 0], offset: 5 },
          },
          type: "delete_text",
        },
      ],
    });
    expect(
      applyTransaction(document, result.transaction!).children[0]?.children[0]?.text,
    ).toBe("你好容");
  });

  it("normalizes a reversed range before deleting text", () => {
    const document = createDocument([createParagraph([createText("你好旧内容")])]);
    const result = deleteSelectionCommand.execute({
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 5 },
          focus: { path: [0, 0], offset: 2 },
        },
      },
    });

    expect(result.transaction?.operations[0]).toMatchObject({
      range: {
        anchor: { path: [0, 0], offset: 2 },
        focus: { path: [0, 0], offset: 5 },
      },
      type: "delete_text",
    });
    expect(result.selection).toEqual({
      anchor: { path: [0, 0], offset: 2 },
      focus: { path: [0, 0], offset: 2 },
    });
  });

  it("skips collapsed selections", () => {
    const document = createDocument([createParagraph([createText("你好")])]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 2 },
          focus: { path: [0, 0], offset: 2 },
        },
      },
    };

    expect(canExecuteDeleteSelectionCommand(input)).toBe(false);
    expect(deleteSelectionCommand.execute(input)).toEqual({
      commandName: "deleteSelection",
      ok: false,
      reason: "Delete selection command requires a non-collapsed text selection.",
      status: "skipped",
    });
  });
});
