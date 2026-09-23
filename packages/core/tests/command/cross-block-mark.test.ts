import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  boldCommand,
  createDivider,
  createDocument,
  createHeading,
  createParagraph,
  createQuote,
  createText,
  hasTextMark,
  isTextBlockNode,
  italicCommand,
  strikeCommand,
  underlineCommand,
  type Command,
  type TextMarkType,
} from "../../src";

const MARK_COMMANDS: Array<{ command: Command; mark: TextMarkType }> = [
  { command: boldCommand, mark: "bold" },
  { command: italicCommand, mark: "italic" },
  { command: underlineCommand, mark: "underline" },
  { command: strikeCommand, mark: "strike" },
];

describe("cross-block text mark commands", () => {
  it.each(MARK_COMMANDS)(
    "applies and removes $mark uniformly from a reversed range",
    ({ command, mark }) => {
      const document = createDocument([
        createParagraph([createText("开头")]),
        createHeading(2, [createText("标题", { [mark]: true })]),
        createQuote([createText("引用")]),
      ]);
      const selection = {
        anchor: { path: [2, 0], offset: 1 },
        focus: { path: [0, 0], offset: 1 },
      };
      const result = command.execute({ context: { document, selection } });

      expect(result.transaction?.operations).toHaveLength(3);
      expect(result.transaction?.operations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ active: true, mark, type: "toggle_mark" }),
        ]),
      );
      expect(result.selection).toEqual({
        anchor: { path: [2, 0], offset: 1 },
        focus: { path: [0, 1], offset: 0 },
      });

      const markedDocument = applyTransaction(document, result.transaction!);
      const markedSelection = result.selection!;

      expect(
        markedDocument.children.every(
          (block) =>
            isTextBlockNode(block) &&
            block.children.some((text) => hasTextMark(text.marks, mark)),
        ),
      ).toBe(true);
      expect(
        command.isActive?.({
          context: { document: markedDocument, selection: markedSelection },
        }),
      ).toBe(true);

      const removeResult = command.execute({
        context: { document: markedDocument, selection: markedSelection },
      });
      expect(removeResult.transaction?.operations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ active: false, mark, type: "toggle_mark" }),
        ]),
      );
    },
  );

  it("rejects a range that crosses a structural block", () => {
    const document = createDocument([
      createParagraph([createText("开头")]),
      createDivider(),
      createParagraph([createText("结尾")]),
    ]);
    const result = boldCommand.execute({
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [2, 0], offset: 1 },
        },
      },
    });

    expect(result.status).toBe("skipped");
    expect(result.transaction).toBeUndefined();
  });
});
