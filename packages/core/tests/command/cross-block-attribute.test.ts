import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  createDocument,
  createHeading,
  createParagraph,
  createQuote,
  createText,
  isTextBlockNode,
  setBackgroundColorCommand,
  setFontSizeCommand,
  setTextColorCommand,
  type Command,
  type TextMarkAttributeType,
} from "../../src";

const ATTRIBUTE_COMMANDS: Array<{
  attribute: TextMarkAttributeType;
  cancelPayload: Record<string, null>;
  command: Command;
  expected: number | string;
  payload: Record<string, number | string>;
}> = [
  {
    attribute: "fontSize",
    cancelPayload: { fontSize: null },
    command: setFontSizeCommand,
    expected: 20,
    payload: { fontSize: 20 },
  },
  {
    attribute: "textColor",
    cancelPayload: { textColor: null },
    command: setTextColorCommand,
    expected: "#aabbcc",
    payload: { textColor: "#abc" },
  },
  {
    attribute: "backgroundColor",
    cancelPayload: { backgroundColor: null },
    command: setBackgroundColorCommand,
    expected: "#ffeeaa",
    payload: { backgroundColor: "#fea" },
  },
];

describe("cross-block text mark attribute commands", () => {
  it.each(ATTRIBUTE_COMMANDS)(
    "sets and removes $attribute across a reversed range",
    ({ attribute, cancelPayload, command, expected, payload }) => {
      const document = createDocument([
        createParagraph([createText("正文", { bold: true })]),
        createHeading(2, [createText("标题")]),
        createQuote([createText("引用")]),
      ]);
      const selection = {
        anchor: { path: [2, 0], offset: 1 },
        focus: { path: [0, 0], offset: 1 },
      };
      const result = command.execute({
        context: { document, selection },
        payload,
      });

      expect(result.transaction?.operations).toHaveLength(3);
      expect(result.selection).toEqual({
        anchor: { path: [2, 0], offset: 1 },
        focus: { path: [0, 1], offset: 0 },
      });

      const markedDocument = applyTransaction(document, result.transaction!);

      expect(
        markedDocument.children.every(
          (block) =>
            isTextBlockNode(block) &&
            block.children.some((text) => text.marks?.[attribute] === expected),
        ),
      ).toBe(true);

      const cancelResult = command.execute({
        context: { document: markedDocument, selection: result.selection! },
        payload: cancelPayload,
      });
      const clearedDocument = applyTransaction(
        markedDocument,
        cancelResult.transaction!,
      );

      expect(
        clearedDocument.children.every(
          (block) =>
            isTextBlockNode(block) &&
            block.children.every((text) => text.marks?.[attribute] === undefined),
        ),
      ).toBe(true);
      expect(clearedDocument.children[0]?.children).toContainEqual(
        expect.objectContaining({ marks: { bold: true } }),
      );
    },
  );

  it("keeps a cross-block selection when its last segment is empty", () => {
    const document = createDocument([
      createParagraph([createText("前段")]),
      createParagraph([createText("后")]),
    ]);
    const selection = {
      anchor: { path: [0, 0], offset: 1 },
      focus: { path: [1, 0], offset: 0 },
    };
    const result = setFontSizeCommand.execute({
      context: { document, selection },
      payload: { fontSize: 18 },
    });

    expect(result.transaction?.operations).toHaveLength(1);
    expect(result.selection).toEqual({
      anchor: { path: [0, 1], offset: 0 },
      focus: { path: [1, 0], offset: 0 },
    });
  });
});
