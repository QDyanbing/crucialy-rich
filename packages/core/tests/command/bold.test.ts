import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  boldCommand,
  canExecuteBoldCommand,
  createDocument,
  createParagraph,
  createText,
  insertTextCommand,
  isBoldCommandActive,
} from "../../src";

describe("boldCommand", () => {
  it("toggles bold on a selected text range", () => {
    const document = createDocument([createParagraph([createText("你好世界")])]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [0, 0], offset: 3 },
        },
      },
    };
    const result = boldCommand.execute(input);

    expect(canExecuteBoldCommand(input)).toBe(true);
    expect(result.ok).toBe(true);
    expect(result.transaction?.operations).toEqual([
      {
        mark: "bold",
        range: {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [0, 0], offset: 3 },
        },
        type: "toggle_mark",
      },
    ]);
    expect(
      applyTransaction(document, result.transaction!).children[0]?.children,
    ).toEqual([
      { type: "text", text: "你" },
      { type: "text", text: "好世", marks: { bold: true } },
      { type: "text", text: "界" },
    ]);
    expect(result.selection).toEqual({
      anchor: { path: [0, 1], offset: 0 },
      focus: { path: [0, 1], offset: 2 },
    });
  });

  it("removes bold from an already bold range", () => {
    const document = createDocument([
      createParagraph([createText("你好", { bold: true })]),
    ]);
    const result = boldCommand.execute({
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 2 },
        },
      },
    });

    expect(
      applyTransaction(document, result.transaction!).children[0]?.children[0],
    ).toEqual({
      type: "text",
      text: "你好",
    });
  });

  it("uses collapsed bold placeholders for later text input", () => {
    const document = createDocument([createParagraph([createText("你好世界")])]);
    const boldResult = boldCommand.execute({
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 2 },
          focus: { path: [0, 0], offset: 2 },
        },
      },
    });
    const boldDocument = applyTransaction(document, boldResult.transaction!);
    const insertResult = insertTextCommand.execute({
      context: {
        document: boldDocument,
        selection: boldResult.selection,
      },
      payload: { text: "粗" },
    });

    expect(
      applyTransaction(boldDocument, insertResult.transaction!).children[0]?.children,
    ).toEqual([
      { type: "text", text: "你好" },
      { type: "text", text: "粗", marks: { bold: true } },
      { type: "text", text: "世界" },
    ]);
  });

  it("reports active state from the selected text node", () => {
    const document = createDocument([
      createParagraph([createText("你好", { bold: true })]),
    ]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [0, 0], offset: 1 },
        },
      },
    };

    expect(isBoldCommandActive(input)).toBe(true);
  });

  it("skips invalid or cross-node selections", () => {
    const document = createDocument([
      createParagraph([createText("你好"), createText("世界")]),
    ]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [0, 1], offset: 1 },
        },
      },
    };

    expect(canExecuteBoldCommand(input)).toBe(false);
    expect(boldCommand.execute(input)).toEqual({
      commandName: "bold",
      ok: false,
      reason: "Bold command requires a text selection.",
      status: "skipped",
    });
  });
});
