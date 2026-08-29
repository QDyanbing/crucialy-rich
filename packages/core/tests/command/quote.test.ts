import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecuteToggleQuoteCommand,
  createDocument,
  createHeading,
  createParagraph,
  createQuote,
  createText,
  isQuoteCommandActive,
  toggleQuoteCommand,
} from "../../src";

const collapsedSelection = {
  anchor: { path: [0, 0], offset: 2 },
  focus: { path: [0, 0], offset: 2 },
};

describe("toggleQuoteCommand", () => {
  it("changes a paragraph into a quote without losing text marks", () => {
    const document = createDocument([
      createParagraph([createText("引用正文", { italic: true })]),
    ]);
    const input = {
      context: { document, selection: collapsedSelection },
    };
    const result = toggleQuoteCommand.execute(input);

    expect(canExecuteToggleQuoteCommand(input)).toBe(true);
    expect(result.transaction?.operations).toEqual([
      {
        block: { type: "quote" },
        path: [0],
        type: "set_block_type",
      },
    ]);
    expect(applyTransaction(document, result.transaction!).children[0]).toEqual({
      children: [{ marks: { italic: true }, text: "引用正文", type: "text" }],
      type: "quote",
    });
    expect(result.selection).toEqual(collapsedSelection);
    expect(result.selection).not.toBe(collapsedSelection);
  });

  it("restores a quote to a paragraph", () => {
    const document = createDocument([createQuote([createText("取消引用")])]);
    const result = toggleQuoteCommand.execute({
      context: { document, selection: collapsedSelection },
    });

    expect(applyTransaction(document, result.transaction!).children[0]).toEqual({
      children: [{ text: "取消引用", type: "text" }],
      type: "paragraph",
    });
  });

  it("changes a heading into a quote", () => {
    const document = createDocument([createHeading(2, [createText("原标题")])]);
    const result = toggleQuoteCommand.execute({
      context: { document, selection: collapsedSelection },
    });

    expect(applyTransaction(document, result.transaction!).children[0]).toEqual({
      children: [{ text: "原标题", type: "text" }],
      type: "quote",
    });
  });

  it("accepts a range across sibling text nodes in one block", () => {
    const document = createDocument([
      createParagraph([createText("第一"), createText("第二", { bold: true })]),
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
    const result = toggleQuoteCommand.execute(input);

    expect(canExecuteToggleQuoteCommand(input)).toBe(true);
    expect(applyTransaction(document, result.transaction!).children[0]?.type).toBe(
      "quote",
    );
  });

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
    };

    expect(canExecuteToggleQuoteCommand(input)).toBe(true);
    expect(toggleQuoteCommand.execute(input).status).toBe("success");
  });

  it("changes mixed selected blocks into quotes without losing text marks", () => {
    const document = createDocument([
      createParagraph([createText("第一段", { bold: true })]),
      createQuote([createText("原引用", { italic: true })]),
      createHeading(3, [createText("原标题", { underline: true })]),
    ]);
    const selection = {
      anchor: { path: [0, 0], offset: 1 },
      focus: { path: [2, 0], offset: 2 },
    };
    const result = toggleQuoteCommand.execute({
      context: { document, selection },
    });

    expect(result.transaction?.operations).toEqual([
      { block: { type: "quote" }, path: [0], type: "set_block_type" },
      { block: { type: "quote" }, path: [1], type: "set_block_type" },
      { block: { type: "quote" }, path: [2], type: "set_block_type" },
    ]);
    expect(applyTransaction(document, result.transaction!).children).toEqual([
      {
        children: [{ marks: { bold: true }, text: "第一段", type: "text" }],
        type: "quote",
      },
      {
        children: [{ marks: { italic: true }, text: "原引用", type: "text" }],
        type: "quote",
      },
      {
        children: [{ marks: { underline: true }, text: "原标题", type: "text" }],
        type: "quote",
      },
    ]);
  });

  it("restores reverse-selected quotes without losing text marks", () => {
    const document = createDocument([
      createQuote([createText("第一段", { bold: true })]),
      createQuote([createText("第二段", { italic: true })]),
      createQuote([createText("第三段", { underline: true })]),
    ]);
    const selection = {
      anchor: { path: [2, 0], offset: 2 },
      focus: { path: [0, 0], offset: 1 },
    };
    const result = toggleQuoteCommand.execute({
      context: { document, selection },
    });

    expect(result.transaction?.operations).toEqual([
      { block: { type: "paragraph" }, path: [0], type: "set_block_type" },
      { block: { type: "paragraph" }, path: [1], type: "set_block_type" },
      { block: { type: "paragraph" }, path: [2], type: "set_block_type" },
    ]);
    expect(applyTransaction(document, result.transaction!).children).toEqual([
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

  it("skips missing and invalid selections", () => {
    const document = createDocument([createParagraph([createText("正文")])]);

    expect(toggleQuoteCommand.execute({ context: { document } }).status).toBe(
      "skipped",
    );
    expect(
      toggleQuoteCommand.execute({
        context: {
          document,
          selection: {
            anchor: { path: [0, 0], offset: 3 },
            focus: { path: [0, 0], offset: 3 },
          },
        },
      }).status,
    ).toBe("skipped");
  });

  it("reports active state only for a selected quote", () => {
    const quote = createDocument([createQuote([createText("引用")])]);
    const paragraph = createDocument([createParagraph([createText("正文")])]);

    expect(
      isQuoteCommandActive({
        context: { document: quote, selection: collapsedSelection },
      }),
    ).toBe(true);
    expect(
      isQuoteCommandActive({
        context: { document: paragraph, selection: collapsedSelection },
      }),
    ).toBe(false);
  });
});
