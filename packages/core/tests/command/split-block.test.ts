import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecuteSplitBlockCommand,
  createCodeBlock,
  createDocument,
  createParagraph,
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

  it("skips non-collapsed selections", () => {
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

    expect(canExecuteSplitBlockCommand(input)).toBe(false);
    expect(splitBlockCommand.execute(input)).toEqual({
      commandName: "splitBlock",
      ok: false,
      reason: "Split block command requires a collapsed text selection.",
      status: "skipped",
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
});
