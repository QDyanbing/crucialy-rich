import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecuteSplitBlockCommand,
  createBulletList,
  createCodeBlock,
  createDivider,
  createDocument,
  createListItem,
  createParagraph,
  createQuote,
  createText,
  splitBlockCommand,
} from "../../src";

describe("splitBlockCommand", () => {
  it("splits a paragraph at a collapsed text selection", () => {
    const document = createDocument([createParagraph([createText("你好世界")])]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 2 },
          focus: { path: [0, 0], offset: 2 },
        },
      },
    };
    const result = splitBlockCommand.execute(input);

    expect(canExecuteSplitBlockCommand(input)).toBe(true);
    expect(result).toMatchObject({
      commandName: "splitBlock",
      ok: true,
      selection: {
        anchor: { path: [1, 0], offset: 0 },
        focus: { path: [1, 0], offset: 0 },
      },
      status: "success",
    });
    expect(result.transaction).toEqual({
      operations: [
        {
          point: { path: [0, 0], offset: 2 },
          type: "split_block",
        },
      ],
    });

    const nextDocument = applyTransaction(document, result.transaction!);

    expect(nextDocument.children).toHaveLength(2);
    expect(nextDocument.children[0]?.children[0]?.text).toBe("你好");
    expect(nextDocument.children[1]?.children[0]?.text).toBe("世界");
  });

  it("deletes and splits a non-collapsed selection", () => {
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

    const result = splitBlockCommand.execute(input);

    expect(canExecuteSplitBlockCommand(input)).toBe(true);
    expect(result.transaction?.operations.map((operation) => operation.type)).toEqual([
      "delete_text",
      "split_block",
    ]);
    expect(applyTransaction(document, result.transaction!)).toEqual(
      createDocument([
        createParagraph([createText("你")]),
        createParagraph([createText("界")]),
      ]),
    );
    expect(result.selection).toEqual({
      anchor: { path: [1, 0], offset: 0 },
      focus: { path: [1, 0], offset: 0 },
    });
  });

  it("exits a quote when selected Enter removes all its text", () => {
    const document = createDocument([createQuote([createText("引用")])]);
    const result = splitBlockCommand.execute({
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 2 },
          focus: { path: [0, 0], offset: 0 },
        },
      },
    });

    expect(result.transaction?.operations.map((operation) => operation.type)).toEqual([
      "delete_text",
      "set_block_type",
    ]);
    expect(applyTransaction(document, result.transaction!)).toEqual(
      createDocument([createParagraph()]),
    );
    expect(result.selection).toEqual({
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 0 },
    });
  });

  it("keeps a quote when selected Enter leaves text behind", () => {
    const document = createDocument([createQuote([createText("引用内容")])]);
    const result = splitBlockCommand.execute({
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [0, 0], offset: 3 },
        },
      },
    });

    expect(result.transaction?.operations.map((operation) => operation.type)).toEqual([
      "delete_text",
      "split_block",
    ]);
    expect(applyTransaction(document, result.transaction!)).toEqual(
      createDocument([
        createQuote([createText("引")]),
        createQuote([createText("容")]),
      ]),
    );
  });

  it("deletes and splits a selection across text blocks", () => {
    const document = createDocument([
      createParagraph([createText("第一段")]),
      createParagraph([createText("中间段")]),
      createParagraph([createText("最后段")]),
    ]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [2, 0], offset: 1 },
        },
      },
    };
    const result = splitBlockCommand.execute(input);

    expect(canExecuteSplitBlockCommand(input)).toBe(true);
    expect(result.transaction?.operations.map((operation) => operation.type)).toEqual([
      "delete_range",
      "split_block",
    ]);
    expect(applyTransaction(document, result.transaction!)).toEqual(
      createDocument([
        createParagraph([createText("第")]),
        createParagraph([createText("后段")]),
      ]),
    );
    expect(result.selection).toEqual({
      anchor: { path: [1, 0], offset: 0 },
      focus: { path: [1, 0], offset: 0 },
    });
  });

  it("inserts newlines and exits code blocks through the same command", () => {
    const document = createDocument([createCodeBlock([createText("code")])]);
    const newlineResult = splitBlockCommand.execute({
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 4 },
          focus: { path: [0, 0], offset: 4 },
        },
      },
    });
    const multilineDocument = applyTransaction(document, newlineResult.transaction!);

    if (!newlineResult.selection) {
      throw new Error("Code block newline should return a selection.");
    }

    const exitResult = splitBlockCommand.execute({
      context: {
        document: multilineDocument,
        selection: newlineResult.selection,
      },
    });

    expect(multilineDocument.children[0]?.children[0]?.text).toBe("code\n");
    expect(
      exitResult.transaction?.operations.map((operation) => operation.type),
    ).toEqual(["split_block", "set_block_type"]);
    expect(
      applyTransaction(multilineDocument, exitResult.transaction!).children.map(
        (block) => block.type,
      ),
    ).toEqual(["codeBlock", "paragraph"]);
  });

  it("replaces a code block selection with a newline", () => {
    const document = createDocument([createCodeBlock([createText("code")])]);
    const result = splitBlockCommand.execute({
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [0, 0], offset: 3 },
        },
      },
    });

    expect(result.transaction?.operations.map((operation) => operation.type)).toEqual([
      "delete_text",
      "insert_text",
    ]);
    expect(applyTransaction(document, result.transaction!)).toEqual(
      createDocument([createCodeBlock([createText("c\ne")])]),
    );
    expect(result.selection?.anchor).toEqual({ path: [0, 0], offset: 2 });
  });

  it("splits a list item after deleting its selected text", () => {
    const document = createDocument([
      createBulletList([createListItem([createText("项目内容")])]),
    ]);
    const result = splitBlockCommand.execute({
      context: {
        document,
        selection: {
          anchor: { path: [0, 0, 0], offset: 1 },
          focus: { path: [0, 0, 0], offset: 3 },
        },
      },
    });

    expect(result.transaction?.operations.map((operation) => operation.type)).toEqual([
      "delete_text",
      "split_list_item",
    ]);
    expect(applyTransaction(document, result.transaction!)).toEqual(
      createDocument([
        createBulletList([
          createListItem([createText("项")]),
          createListItem([createText("容")]),
        ]),
      ]),
    );
  });

  it("rejects selections that cross structural blocks", () => {
    const document = createDocument([
      createParagraph([createText("开头")]),
      createDivider(),
      createParagraph([createText("结尾")]),
    ]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [2, 0], offset: 1 },
        },
      },
    };

    expect(canExecuteSplitBlockCommand(input)).toBe(false);
    expect(splitBlockCommand.execute(input)).toEqual({
      commandName: "splitBlock",
      ok: false,
      reason: "Split block command requires an editable text selection.",
      status: "skipped",
    });
  });
});
