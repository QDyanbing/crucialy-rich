import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecuteItalicCommand,
  createDocument,
  createParagraph,
  createText,
  isItalicCommandActive,
  italicCommand,
} from "../../src";

describe("italicCommand", () => {
  it("toggles italic on a selected text range", () => {
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
    const result = italicCommand.execute(input);

    expect(canExecuteItalicCommand(input)).toBe(true);
    expect(result.ok).toBe(true);
    expect(result.transaction?.operations).toEqual([
      {
        mark: "italic",
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
      { type: "text", text: "好世", marks: { italic: true } },
      { type: "text", text: "界" },
    ]);
  });

  it("removes italic from an already italic range", () => {
    const document = createDocument([
      createParagraph([createText("你好", { italic: true })]),
    ]);
    const result = italicCommand.execute({
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

  it("reports active state from the selected text node", () => {
    const document = createDocument([
      createParagraph([createText("你好", { italic: true })]),
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

    expect(isItalicCommandActive(input)).toBe(true);
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

    expect(canExecuteItalicCommand(input)).toBe(false);
    expect(italicCommand.execute(input)).toEqual({
      commandName: "italic",
      ok: false,
      reason: "Italic command requires a text selection.",
      status: "skipped",
    });
  });
});
