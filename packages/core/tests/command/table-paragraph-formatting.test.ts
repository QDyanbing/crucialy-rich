import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  boldCommand,
  canExecuteUnsetLinkCommand,
  clearFormattingCommand,
  createDocument,
  createParagraph,
  createTableCell,
  createTableRow,
  createText,
  getSelectedLinkMark,
  isBoldCommandActive,
  isLinkCommandActive,
  isTableNode,
  setFontSizeCommand,
  setLinkCommand,
  setTextColorCommand,
  unsetLinkCommand,
} from "../../src";

function createMultiParagraphTable() {
  return createDocument([
    {
      children: [
        createTableRow([
          createTableCell([
            createParagraph([createText("第一段", { bold: true })]),
            createParagraph([createText("第二段")]),
          ]),
        ]),
      ],
      type: "table",
    },
  ]);
}

const forwardSelection = {
  anchor: { path: [0, 0, 0, 0, 0], offset: 0 },
  focus: { path: [0, 0, 0, 1, 0], offset: 3 },
};

describe("table paragraph formatting commands", () => {
  it("applies one boolean mark across paragraphs in the same cell", () => {
    const document = createMultiParagraphTable();
    const result = boldCommand.execute({
      context: { document, selection: forwardSelection },
    });

    expect(result.transaction?.operations).toHaveLength(2);
    expect(result.transaction?.operations).toEqual([
      expect.objectContaining({ active: true, type: "toggle_mark" }),
      expect.objectContaining({ active: true, type: "toggle_mark" }),
    ]);
    expect(result.selection).toEqual(forwardSelection);

    const table = applyTransaction(document, result.transaction!).children[0];

    if (!isTableNode(table)) {
      throw new Error("Expected a table result.");
    }

    expect(
      table.children[0]?.children[0]?.children.every((paragraph) =>
        paragraph.children.every((text) => text.marks?.bold === true),
      ),
    ).toBe(true);
  });

  it("reads and removes a boolean mark from a reversed cell range", () => {
    const document = createDocument([
      {
        children: [
          createTableRow([
            createTableCell([
              createParagraph([createText("第一段", { bold: true })]),
              createParagraph([createText("第二段", { bold: true })]),
            ]),
          ]),
        ],
        type: "table",
      },
    ]);
    const selection = {
      anchor: { path: [0, 0, 0, 1, 0], offset: 3 },
      focus: { path: [0, 0, 0, 0, 0], offset: 0 },
    };
    const input = { context: { document, selection } };

    expect(isBoldCommandActive(input)).toBe(true);

    const result = boldCommand.execute(input);

    if (!result.transaction || !result.selection) {
      throw new Error("Bold command should update the table paragraph range.");
    }

    expect(result.transaction.operations).toEqual([
      expect.objectContaining({ active: false, type: "toggle_mark" }),
      expect.objectContaining({ active: false, type: "toggle_mark" }),
    ]);
    expect(result.selection).toEqual(selection);
    expect(
      isBoldCommandActive({
        context: {
          document: applyTransaction(document, result.transaction!),
          selection: result.selection,
        },
      }),
    ).toBe(false);
  });

  it("sets a text attribute across paragraphs in the same cell", () => {
    const document = createMultiParagraphTable();
    const result = setFontSizeCommand.execute({
      context: { document, selection: forwardSelection },
      payload: { fontSize: 20 },
    });

    expect(result.transaction?.operations).toHaveLength(2);
    expect(result.selection).toEqual(forwardSelection);

    const table = applyTransaction(document, result.transaction!).children[0];

    if (!isTableNode(table)) {
      throw new Error("Expected a table result.");
    }

    expect(
      table.children[0]?.children[0]?.children.every((paragraph) =>
        paragraph.children.every((text) => text.marks?.fontSize === 20),
      ),
    ).toBe(true);
  });

  it("removes a text attribute from a reversed cell range", () => {
    const document = createDocument([
      {
        children: [
          createTableRow([
            createTableCell([
              createParagraph([
                createText("第一段", { bold: true, textColor: "#1677ff" }),
              ]),
              createParagraph([createText("第二段", { textColor: "#1677ff" })]),
            ]),
          ]),
        ],
        type: "table",
      },
    ]);
    const selection = {
      anchor: { path: [0, 0, 0, 1, 0], offset: 3 },
      focus: { path: [0, 0, 0, 0, 0], offset: 0 },
    };
    const result = setTextColorCommand.execute({
      context: { document, selection },
      payload: { textColor: null },
    });
    const table = applyTransaction(document, result.transaction!).children[0];

    expect(result.selection).toEqual(selection);

    if (!isTableNode(table)) {
      throw new Error("Expected a table result.");
    }

    expect(table.children[0]?.children[0]?.children).toEqual([
      createParagraph([createText("第一段", { bold: true })]),
      createParagraph([createText("第二段")]),
    ]);
  });

  it("sets a link across paragraphs in the same cell", () => {
    const document = createMultiParagraphTable();
    const result = setLinkCommand.execute({
      context: { document, selection: forwardSelection },
      payload: { href: "https://example.com/cell" },
    });

    expect(result.transaction?.operations).toHaveLength(2);
    expect(result.selection).toEqual(forwardSelection);

    const table = applyTransaction(document, result.transaction!).children[0];

    if (!isTableNode(table)) {
      throw new Error("Expected a table result.");
    }

    expect(
      table.children[0]?.children[0]?.children.every((paragraph) =>
        paragraph.children.every(
          (text) => text.marks?.link?.href === "https://example.com/cell",
        ),
      ),
    ).toBe(true);
  });

  it("reads and removes one link across cell paragraphs", () => {
    const link = { href: "https://example.com/cell" };
    const document = createDocument([
      {
        children: [
          createTableRow([
            createTableCell([
              createParagraph([createText("第一段", { bold: true, link })]),
              createParagraph([createText("第二段", { link })]),
            ]),
          ]),
        ],
        type: "table",
      },
    ]);
    const selection = {
      anchor: { path: [0, 0, 0, 1, 0], offset: 3 },
      focus: { path: [0, 0, 0, 0, 0], offset: 0 },
    };
    const input = { context: { document, selection } };

    expect(getSelectedLinkMark(input)).toEqual(link);
    expect(isLinkCommandActive(input)).toBe(true);
    expect(canExecuteUnsetLinkCommand(input)).toBe(true);

    const result = unsetLinkCommand.execute(input);
    const table = applyTransaction(document, result.transaction!).children[0];

    expect(result.selection).toEqual(selection);

    if (!isTableNode(table)) {
      throw new Error("Expected a table result.");
    }

    expect(table.children[0]?.children[0]?.children).toEqual([
      createParagraph([createText("第一段", { bold: true })]),
      createParagraph([createText("第二段")]),
    ]);
  });

  it("clears formatting across paragraphs in the same cell", () => {
    const document = createDocument([
      {
        children: [
          createTableRow([
            createTableCell([
              createParagraph([
                createText("第一段", {
                  bold: true,
                  fontSize: 20,
                  link: { href: "https://example.com/cell" },
                }),
              ]),
              createParagraph([
                createText("第二段", {
                  italic: true,
                  textColor: "#1677ff",
                }),
              ]),
            ]),
          ]),
        ],
        type: "table",
      },
    ]);
    const result = clearFormattingCommand.execute({
      context: { document, selection: forwardSelection },
    });

    expect(result.transaction?.operations).toHaveLength(2);
    expect(result.selection).toEqual(forwardSelection);

    const table = applyTransaction(document, result.transaction!).children[0];

    if (!isTableNode(table)) {
      throw new Error("Expected a table result.");
    }

    expect(table.children[0]?.children[0]?.children).toEqual([
      createParagraph([createText("第一段")]),
      createParagraph([createText("第二段")]),
    ]);
  });
});
