import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecuteSetHeadingCommand,
  createDocument,
  createHeading,
  createParagraph,
  createQuote,
  createText,
  getSelectedHeadingLevel,
  insertTextCommand,
  isHeadingCommandActive,
  SET_HEADING_COMMAND_NAME,
  setHeadingCommand,
} from "../../src";

const collapsedSelection = {
  anchor: { path: [0, 0], offset: 2 },
  focus: { path: [0, 0], offset: 2 },
};

describe("setHeadingCommand", () => {
  it("changes a paragraph into the requested heading level", () => {
    const document = createDocument([createParagraph([createText("标题正文")])]);
    const input = {
      context: { document, selection: collapsedSelection },
      payload: { level: 2 as const },
    };
    const result = setHeadingCommand.execute(input);

    expect(canExecuteSetHeadingCommand(input)).toBe(true);
    expect(result.transaction?.operations).toEqual([
      {
        block: { level: 2, type: "heading" },
        path: [0],
        type: "set_block_type",
      },
    ]);
    expect(applyTransaction(document, result.transaction!).children[0]).toEqual({
      children: [{ text: "标题正文", type: "text" }],
      level: 2,
      type: "heading",
    });
    expect(result.selection).toEqual(collapsedSelection);
    expect(result.selection).not.toBe(collapsedSelection);
  });

  it("switches an existing heading to another level", () => {
    const document = createDocument([createHeading(1, [createText("切换标题层级")])]);
    const result = setHeadingCommand.execute({
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 6 },
        },
      },
      payload: { level: 6 },
    });

    expect(applyTransaction(document, result.transaction!).children[0]).toMatchObject({
      children: [{ text: "切换标题层级", type: "text" }],
      level: 6,
      type: "heading",
    });
  });

  it("restores a heading to a paragraph", () => {
    const document = createDocument([createHeading(3, [createText("恢复正文")])]);
    const result = setHeadingCommand.execute({
      context: { document, selection: collapsedSelection },
      payload: { level: null },
    });

    expect(applyTransaction(document, result.transaction!).children[0]).toEqual({
      children: [{ text: "恢复正文", type: "text" }],
      type: "paragraph",
    });
  });

  it.each([1, 2, 3, 4, 5, 6] as const)("accepts heading level %s", (level) => {
    const document = createDocument([createParagraph([createText("合法层级")])]);

    expect(
      canExecuteSetHeadingCommand({
        context: { document, selection: collapsedSelection },
        payload: { level },
      }),
    ).toBe(true);
  });

  it.each([{ level: 0 }, { level: 7 }, { level: 1.5 }, { level: "2" }, {}])(
    "skips an invalid heading payload: $level",
    (payload) => {
      const document = createDocument([createParagraph([createText("非法层级")])]);
      const input = {
        context: { document, selection: collapsedSelection },
        payload,
      };

      expect(canExecuteSetHeadingCommand(input)).toBe(false);
      expect(setHeadingCommand.execute(input)).toEqual({
        commandName: SET_HEADING_COMMAND_NAME,
        ok: false,
        reason: "Set heading command requires a valid level and text selection.",
        status: "skipped",
      });
    },
  );

  it("accepts a selection that crosses blocks", () => {
    const document = createDocument([
      createParagraph([createText("第一段")]),
      createParagraph([createText("第二段")]),
    ]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [1, 0], offset: 1 },
        },
      },
      payload: { level: 2 as const },
    };

    expect(canExecuteSetHeadingCommand(input)).toBe(true);
    expect(setHeadingCommand.execute(input).status).toBe("success");
  });

  it("sets every block in a forward mixed selection to one heading level", () => {
    const document = createDocument([
      createParagraph([createText("第一段")]),
      createHeading(1, [createText("原标题")]),
      createQuote([createText("原引用")]),
    ]);
    const selection = {
      anchor: { path: [0, 0], offset: 1 },
      focus: { path: [2, 0], offset: 2 },
    };
    const result = setHeadingCommand.execute({
      context: { document, selection },
      payload: { level: 3 },
    });

    expect(result.transaction?.operations).toEqual([
      {
        block: { level: 3, type: "heading" },
        path: [0],
        type: "set_block_type",
      },
      {
        block: { level: 3, type: "heading" },
        path: [1],
        type: "set_block_type",
      },
      {
        block: { level: 3, type: "heading" },
        path: [2],
        type: "set_block_type",
      },
    ]);
    expect(applyTransaction(document, result.transaction!).children).toEqual([
      { children: [{ text: "第一段", type: "text" }], level: 3, type: "heading" },
      { children: [{ text: "原标题", type: "text" }], level: 3, type: "heading" },
      { children: [{ text: "原引用", type: "text" }], level: 3, type: "heading" },
    ]);
  });

  it("restores a reverse heading selection without losing text marks", () => {
    const document = createDocument([
      createHeading(2, [createText("第一段", { bold: true })]),
      createHeading(2, [createText("第二段", { italic: true })]),
      createHeading(2, [createText("第三段", { underline: true })]),
    ]);
    const selection = {
      anchor: { path: [2, 0], offset: 2 },
      focus: { path: [0, 0], offset: 1 },
    };
    const result = setHeadingCommand.execute({
      context: { document, selection },
      payload: { level: null },
    });
    const nextDocument = applyTransaction(document, result.transaction!);

    expect(result.transaction?.operations).toEqual([
      { block: { type: "paragraph" }, path: [0], type: "set_block_type" },
      { block: { type: "paragraph" }, path: [1], type: "set_block_type" },
      { block: { type: "paragraph" }, path: [2], type: "set_block_type" },
    ]);
    expect(nextDocument.children).toEqual([
      {
        children: [{ marks: { bold: true }, text: "第一段", type: "text" }],
        type: "paragraph",
      },
      {
        children: [{ marks: { italic: true }, text: "第二段", type: "text" }],
        type: "paragraph",
      },
      {
        children: [{ marks: { underline: true }, text: "第三段", type: "text" }],
        type: "paragraph",
      },
    ]);
    expect(result.selection).toEqual(selection);
    expect(result.selection).not.toBe(selection);
  });

  it("reports the selected heading level and active target", () => {
    const document = createDocument([createHeading(4, [createText("状态")])]);
    const input = {
      context: { document, selection: collapsedSelection },
      payload: { level: 4 as const },
    };

    expect(getSelectedHeadingLevel(input)).toBe(4);
    expect(isHeadingCommandActive(input)).toBe(true);
    expect(isHeadingCommandActive({ ...input, payload: { level: 3 } })).toBe(false);
  });

  it("keeps the selection usable for text insertion after switching", () => {
    const document = createDocument([createParagraph([createText("继续编辑")])]);
    const headingResult = setHeadingCommand.execute({
      context: { document, selection: collapsedSelection },
      payload: { level: 2 },
    });
    const headingDocument = applyTransaction(document, headingResult.transaction!);

    if (!headingResult.selection) {
      throw new Error("Set heading command should preserve the selection.");
    }

    const insertResult = insertTextCommand.execute({
      context: {
        document: headingDocument,
        selection: headingResult.selection,
      },
      payload: { text: "标题" },
    });

    expect(
      applyTransaction(headingDocument, insertResult.transaction!).children[0],
    ).toEqual({
      children: [{ text: "继续标题编辑", type: "text" }],
      level: 2,
      type: "heading",
    });
  });
});
