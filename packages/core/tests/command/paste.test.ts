import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecutePasteCommand,
  createDefaultCommandRegistry,
  createDocument,
  createParagraph,
  createTable,
  createText,
  executeCommand,
  parseHtml,
  parsePlainText,
  PASTE_COMMAND_NAME,
  pasteCommand,
  isImageNode,
  isTableNode,
  isTaskListNode,
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

  it("replaces a selection across adjacent marked text nodes", () => {
    const document = createDocument([
      createParagraph([
        createText("前"),
        createText("旧一", { bold: true }),
        createText("旧二", { italic: true }),
        createText("后"),
      ]),
    ]);
    const result = pasteCommand.execute({
      context: {
        document,
        selection: {
          anchor: { offset: 1, path: [0, 1] },
          focus: { offset: 1, path: [0, 2] },
        },
      },
      payload: { fragment: parsePlainText("新")! },
    });

    expect(applyTransaction(document, result.transaction!).children[0]).toEqual(
      createParagraph([
        createText("前"),
        createText("旧新", { bold: true }),
        createText("二", { italic: true }),
        createText("后"),
      ]),
    );
    expect(result.selection?.anchor).toEqual({ offset: 2, path: [0, 1] });
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

  it("inserts nested HTML lists and moves the caret to the deepest last item", () => {
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
        fragment: parseHtml("<ul><li>父项<ol><li>子项</li></ol></li></ul>")!,
      },
    });
    const resultDocument = applyTransaction(document, result.transaction!);

    expect(result.transaction?.operations.map((operation) => operation.type)).toEqual([
      "split_block",
      "insert_block",
    ]);
    expect(resultDocument.children[1]).toMatchObject({
      children: [
        {
          children: [{ text: "父项" }],
          nested: {
            children: [{ children: [{ text: "子项" }] }],
            type: "orderedList",
          },
        },
      ],
      type: "bulletList",
    });
    expect(result.selection?.anchor).toEqual({
      offset: 2,
      path: [1, 0, 1, 0, 0],
    });
  });

  it("pastes nested HTML mark aliases without flattening them", () => {
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
        fragment: parseHtml("<p><b><i><u><del>组合样式</del></u></i></b></p>")!,
      },
    });
    const resultDocument = applyTransaction(document, result.transaction!);

    expect(result.transaction?.operations.map((operation) => operation.type)).toEqual([
      "split_block",
      "insert_block",
    ]);
    expect(resultDocument.children[1]).toMatchObject({
      children: [
        {
          marks: {
            bold: true,
            italic: true,
            strike: true,
            underline: true,
          },
          text: "组合样式",
        },
      ],
      type: "paragraph",
    });
    expect(result.selection?.anchor).toEqual({ offset: 4, path: [1, 0] });
  });

  it("pastes HTML link metadata without flattening it", () => {
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
        fragment: parseHtml(
          '<p><a href="https://example.com/docs" target="_blank" rel="noopener noreferrer"><b>链接文档</b></a></p>',
        )!,
      },
    });
    const resultDocument = applyTransaction(document, result.transaction!);

    expect(resultDocument.children[1]).toMatchObject({
      children: [
        {
          marks: {
            bold: true,
            link: {
              href: "https://example.com/docs",
              rel: "noopener noreferrer",
              target: "_blank",
            },
          },
          text: "链接文档",
        },
      ],
      type: "paragraph",
    });
    expect(result.selection?.anchor).toEqual({ offset: 4, path: [1, 0] });
  });

  it("inserts a parsed HTML table as a structured block", () => {
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
        fragment: parseHtml(
          "<table><tr><td>姓名</td><td>角色</td></tr><tr><td>小明</td><td>开发</td></tr></table>",
        )!,
      },
    });
    const resultDocument = applyTransaction(document, result.transaction!);

    expect(result.transaction?.operations.map((operation) => operation.type)).toEqual([
      "split_block",
      "insert_block",
    ]);
    expect(resultDocument.children.map((block) => block.type)).toEqual([
      "paragraph",
      "table",
      "paragraph",
    ]);

    const table = resultDocument.children[1];

    expect(isTableNode(table)).toBe(true);

    if (!isTableNode(table)) {
      throw new Error("expected table result");
    }

    expect(
      table.children.map((row) =>
        row.children.map((cell) => cell.children[0]?.children[0]?.text),
      ),
    ).toEqual([
      ["姓名", "角色"],
      ["小明", "开发"],
    ]);
    expect(result.selection?.anchor).toEqual({ offset: 0, path: [2, 0] });
  });

  it("inserts a parsed HTML image as a structured block", () => {
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
        fragment: parseHtml(
          '<img src="https://example.com/cover.png" alt="封面" width="640" height="360">',
        )!,
      },
    });
    const resultDocument = applyTransaction(document, result.transaction!);
    const image = resultDocument.children[1];

    expect(result.transaction?.operations.map((operation) => operation.type)).toEqual([
      "split_block",
      "insert_block",
    ]);
    expect(resultDocument.children.map((block) => block.type)).toEqual([
      "paragraph",
      "image",
      "paragraph",
    ]);
    expect(isImageNode(image)).toBe(true);
    expect(image).toMatchObject({
      alt: "封面",
      height: 360,
      src: "https://example.com/cover.png",
      width: 640,
    });
    expect(result.selection?.anchor).toEqual({ offset: 0, path: [2, 0] });
  });

  it("inserts a parsed HTML task list as a structured block", () => {
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
        fragment: parseHtml(
          '<ul><li><input type="checkbox" checked>已完成</li><li><input type="checkbox">待处理</li></ul>',
        )!,
      },
    });
    const resultDocument = applyTransaction(document, result.transaction!);
    const taskList = resultDocument.children[1];

    expect(result.transaction?.operations.map((operation) => operation.type)).toEqual([
      "split_block",
      "insert_block",
    ]);
    expect(resultDocument.children.map((block) => block.type)).toEqual([
      "paragraph",
      "taskList",
      "paragraph",
    ]);
    expect(isTaskListNode(taskList)).toBe(true);
    expect(taskList).toMatchObject({
      children: [
        { checked: true, type: "taskItem" },
        { checked: false, type: "taskItem" },
      ],
    });
    expect(result.selection?.anchor).toEqual({ offset: 3, path: [1, 1, 0] });
  });

  it("pastes one TSV row across table cells", () => {
    const document = createDocument([createTable(2, 3)]);
    const result = pasteCommand.execute({
      context: {
        document,
        selection: {
          anchor: { offset: 0, path: [0, 0, 1, 0, 0] },
          focus: { offset: 0, path: [0, 0, 1, 0, 0] },
        },
      },
      payload: { fragment: parsePlainText("姓名\t角色")! },
    });
    const resultTable = applyTransaction(document, result.transaction!).children[0];

    expect(isTableNode(resultTable)).toBe(true);

    if (!isTableNode(resultTable)) {
      throw new Error("expected table result");
    }

    expect(
      resultTable.children[0]?.children.map(
        (cell) => cell.children[0]?.children[0]?.text,
      ),
    ).toEqual(["", "姓名", "角色"]);
    expect(result.selection?.anchor).toEqual({
      offset: 2,
      path: [0, 0, 2, 0, 0],
    });
  });

  it("pastes multiple TSV rows without changing table dimensions", () => {
    const document = createDocument([createTable(2, 2)]);
    const result = pasteCommand.execute({
      context: {
        document,
        selection: {
          anchor: { offset: 0, path: [0, 0, 0, 0, 0] },
          focus: { offset: 0, path: [0, 0, 0, 0, 0] },
        },
      },
      payload: { fragment: parsePlainText("小明\t开发\n小红\t设计")! },
    });
    const resultTable = applyTransaction(document, result.transaction!).children[0];

    expect(isTableNode(resultTable)).toBe(true);

    if (!isTableNode(resultTable)) {
      throw new Error("expected table result");
    }

    expect(resultTable.children).toHaveLength(2);
    expect(
      resultTable.children.map((row) =>
        row.children.map((cell) => cell.children[0]?.children[0]?.text),
      ),
    ).toEqual([
      ["小明", "开发"],
      ["小红", "设计"],
    ]);
  });

  it("falls back to in-cell text when TSV exceeds remaining columns", () => {
    const document = createDocument([createTable(1, 2)]);
    const result = pasteCommand.execute({
      context: {
        document,
        selection: {
          anchor: { offset: 0, path: [0, 0, 1, 0, 0] },
          focus: { offset: 0, path: [0, 0, 1, 0, 0] },
        },
      },
      payload: { fragment: parsePlainText("甲\t乙")! },
    });
    const resultTable = applyTransaction(document, result.transaction!).children[0];

    expect(result.transaction?.operations.map((operation) => operation.type)).toEqual([
      "insert_text",
    ]);
    expect(isTableNode(resultTable)).toBe(true);

    if (!isTableNode(resultTable)) {
      throw new Error("expected table result");
    }

    expect(resultTable.children[0]?.children).toHaveLength(2);
    expect(resultTable.children[0]?.children[1]?.children[0]?.children[0]?.text).toBe(
      "甲\t乙",
    );
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
