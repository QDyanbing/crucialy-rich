import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecutePasteCommand,
  createDefaultCommandRegistry,
  createDocument,
  createParagraph,
  createText,
  executeCommand,
  parseHtml,
  parsePlainText,
  PASTE_COMMAND_NAME,
  pasteCommand,
} from "../../src";

describe("pasteCommand", () => {
  it("inserts a single plain-text line at the caret", () => {
    const document = createDocument([createParagraph([createText("前后")])]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { offset: 1, path: [0, 0] },
          focus: { offset: 1, path: [0, 0] },
        },
      },
      payload: { fragment: parsePlainText("中间")! },
    };
    const result = pasteCommand.execute(input);

    expect(canExecutePasteCommand(input)).toBe(true);
    expect(result.selection?.anchor).toEqual({ offset: 3, path: [0, 0] });
    expect(applyTransaction(document, result.transaction!).children).toEqual([
      createParagraph([createText("前中间后")]),
    ]);
  });

  it("replaces an expanded selection", () => {
    const document = createDocument([createParagraph([createText("前旧后")])]);
    const result = executeCommand(createDefaultCommandRegistry(), PASTE_COMMAND_NAME, {
      context: {
        document,
        selection: {
          anchor: { offset: 1, path: [0, 0] },
          focus: { offset: 2, path: [0, 0] },
        },
      },
      payload: { fragment: parsePlainText("新")! },
    });

    expect(result.transaction?.operations.map((operation) => operation.type)).toEqual([
      "delete_text",
      "insert_text",
    ]);
    expect(applyTransaction(document, result.transaction!).children).toEqual([
      createParagraph([createText("前新后")]),
    ]);
  });

  it("turns line breaks into paragraphs joined to surrounding text", () => {
    const document = createDocument([createParagraph([createText("前旧后")])]);
    const result = pasteCommand.execute({
      context: {
        document,
        selection: {
          anchor: { offset: 2, path: [0, 0] },
          focus: { offset: 1, path: [0, 0] },
        },
      },
      payload: { fragment: parsePlainText("第一行\n\n第三行")! },
    });

    expect(result.transaction?.operations.map((operation) => operation.type)).toEqual([
      "delete_text",
      "insert_text",
      "split_block",
      "insert_text",
      "split_block",
      "insert_text",
    ]);
    expect(applyTransaction(document, result.transaction!).children).toEqual([
      createParagraph([createText("前第一行")]),
      createParagraph([createText("")]),
      createParagraph([createText("第三行后")]),
    ]);
    expect(result.selection?.anchor).toEqual({ offset: 3, path: [2, 0] });
  });

  it("inserts structured HTML blocks without flattening marks", () => {
    const document = createDocument([createParagraph([createText("前后")])]);
    const result = pasteCommand.execute({
      context: {
        document,
        selection: {
          anchor: { offset: 1, path: [0, 0] },
          focus: { offset: 1, path: [0, 0] },
        },
      },
      payload: {
        fragment: parseHtml("<p><strong>加粗</strong></p><ul><li>列表</li></ul>")!,
      },
    });
    const resultDocument = applyTransaction(document, result.transaction!);

    expect(resultDocument.children.map((block) => block.type)).toEqual([
      "paragraph",
      "paragraph",
      "bulletList",
      "paragraph",
    ]);
    expect(resultDocument.children[1]).toMatchObject({
      children: [{ marks: { bold: true }, text: "加粗" }],
    });
    expect(result.selection?.anchor).toEqual({ offset: 2, path: [2, 0, 0] });
  });

  it("skips missing fragments and invalid selections", () => {
    const document = createDocument();

    expect(pasteCommand.execute({ context: { document } }).status).toBe("skipped");
    expect(
      pasteCommand.execute({
        context: {
          document,
          selection: {
            anchor: { offset: 0, path: [9, 0] },
            focus: { offset: 0, path: [9, 0] },
          },
        },
        payload: { fragment: parsePlainText("文字")! },
      }).status,
    ).toBe("skipped");
  });
});
