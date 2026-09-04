import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecuteInsertDividerCommand,
  createCodeBlock,
  createDocument,
  createParagraph,
  createText,
  insertDividerCommand,
} from "../../src";

describe("insertDividerCommand", () => {
  it("splits the selected block around a divider", () => {
    const document = createDocument([createParagraph([createText("上下")])]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { offset: 1, path: [0, 0] },
          focus: { offset: 1, path: [0, 0] },
        },
      },
    };
    const result = insertDividerCommand.execute(input);

    expect(canExecuteInsertDividerCommand(input)).toBe(true);
    expect(result).toMatchObject({
      commandName: "insertDivider",
      ok: true,
      selection: {
        anchor: { offset: 0, path: [2, 0] },
        focus: { offset: 0, path: [2, 0] },
      },
      status: "success",
    });
    expect(result.transaction?.operations.map((operation) => operation.type)).toEqual([
      "split_block",
      "insert_block",
    ]);
    expect(applyTransaction(document, result.transaction!).children).toEqual([
      { children: [{ text: "上", type: "text" }], type: "paragraph" },
      { children: [], type: "divider" },
      { children: [{ text: "下", type: "text" }], type: "paragraph" },
    ]);
  });

  it("preserves code block type on both sides", () => {
    const document = createDocument([createCodeBlock([createText("a\nb")])]);
    const result = insertDividerCommand.execute({
      context: {
        document,
        selection: {
          anchor: { offset: 2, path: [0, 0] },
          focus: { offset: 2, path: [0, 0] },
        },
      },
    });

    expect(
      applyTransaction(document, result.transaction!).children.map(
        (block) => block.type,
      ),
    ).toEqual(["codeBlock", "divider", "codeBlock"]);
  });

  it("skips missing and expanded selections", () => {
    const document = createDocument();

    expect(insertDividerCommand.execute({ context: { document } }).status).toBe(
      "skipped",
    );
    expect(
      canExecuteInsertDividerCommand({
        context: {
          document,
          selection: {
            anchor: { offset: 0, path: [0, 0] },
            focus: { offset: 1, path: [0, 0] },
          },
        },
      }),
    ).toBe(false);
  });
});
