import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  boldCommand,
  canExecuteClearFormattingCommand,
  canExecuteSetFontSizeCommand,
  canExecuteSetLinkCommand,
  clearFormattingCommand,
  createDocument,
  createListItem,
  createOrderedList,
  createParagraph,
  createTableCell,
  createTableRow,
  createText,
  isBoldCommandActive,
  isListNode,
  isTableNode,
  setFontSizeCommand,
  setLinkCommand,
} from "../../src";

describe("nested text formatting commands", () => {
  it("applies and reads boolean marks in one list item", () => {
    const document = createDocument([
      createOrderedList([createListItem([createText("列表文字")])]),
    ]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0, 0], offset: 0 },
          focus: { path: [0, 0, 0], offset: 4 },
        },
      },
    };
    const result = boldCommand.execute(input);

    expect(result.ok).toBe(true);
    expect(result.selection).toEqual(input.context.selection);

    if (!result.selection) {
      throw new Error("Bold command should preserve the list selection.");
    }

    const nextDocument = applyTransaction(document, result.transaction!);
    const list = nextDocument.children[0];

    if (!isListNode(list)) {
      throw new Error("Expected an ordered list result.");
    }

    expect(list.children[0]?.children).toEqual([
      { marks: { bold: true }, text: "列表文字", type: "text" },
    ]);
    expect(
      isBoldCommandActive({
        context: { document: nextDocument, selection: result.selection },
      }),
    ).toBe(true);
  });

  it("applies styles and links in one table paragraph", () => {
    const document = createDocument([
      {
        children: [
          createTableRow([
            createTableCell([createParagraph([createText("单元格文字")])]),
          ]),
        ],
        type: "table",
      },
    ]);
    const selection = {
      anchor: { path: [0, 0, 0, 0, 0], offset: 0 },
      focus: { path: [0, 0, 0, 0, 0], offset: 5 },
    };
    const sizeInput = {
      context: { document, selection },
      payload: { fontSize: 20 },
    };

    expect(canExecuteSetFontSizeCommand(sizeInput)).toBe(true);

    const sizeResult = setFontSizeCommand.execute(sizeInput);

    if (!sizeResult.selection) {
      throw new Error("Font size command should preserve the table selection.");
    }

    const styledDocument = applyTransaction(document, sizeResult.transaction!);
    const linkInput = {
      context: { document: styledDocument, selection: sizeResult.selection },
      payload: { href: "https://example.com/table" },
    };

    expect(canExecuteSetLinkCommand(linkInput)).toBe(true);

    const linkResult = setLinkCommand.execute(linkInput);

    if (!linkResult.selection) {
      throw new Error("Link command should preserve the table selection.");
    }

    const linkedDocument = applyTransaction(styledDocument, linkResult.transaction!);
    const table = linkedDocument.children[0];

    if (!isTableNode(table)) {
      throw new Error("Expected a table result.");
    }

    expect(table.children[0]?.children[0]?.children[0]?.children).toEqual([
      {
        marks: {
          fontSize: 20,
          link: { href: "https://example.com/table" },
        },
        text: "单元格文字",
        type: "text",
      },
    ]);
    expect(
      canExecuteClearFormattingCommand({
        context: { document: linkedDocument, selection: linkResult.selection },
      }),
    ).toBe(true);

    const clearResult = clearFormattingCommand.execute({
      context: { document: linkedDocument, selection: linkResult.selection },
    });

    expect(
      applyTransaction(linkedDocument, clearResult.transaction!).children[0],
    ).toEqual(document.children[0]);
  });

  it("rejects selections across list items or table cells", () => {
    const listDocument = createDocument([
      createOrderedList([
        createListItem([createText("第一项")]),
        createListItem([createText("第二项")]),
      ]),
    ]);
    const tableDocument = createDocument([
      {
        children: [
          createTableRow([
            createTableCell([createParagraph([createText("左侧")])]),
            createTableCell([createParagraph([createText("右侧")])]),
          ]),
        ],
        type: "table",
      },
    ]);

    expect(
      boldCommand.execute({
        context: {
          document: listDocument,
          selection: {
            anchor: { path: [0, 0, 0], offset: 0 },
            focus: { path: [0, 1, 0], offset: 3 },
          },
        },
      }).status,
    ).toBe("skipped");
    expect(
      clearFormattingCommand.execute({
        context: {
          document: tableDocument,
          selection: {
            anchor: { path: [0, 0, 0, 0, 0], offset: 0 },
            focus: { path: [0, 0, 1, 0, 0], offset: 2 },
          },
        },
      }).status,
    ).toBe("skipped");
  });
});
