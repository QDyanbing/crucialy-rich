import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  createBulletList,
  createCodeBlock,
  createDocument,
  createEnterInputTransaction,
  createListItem,
  createParagraph,
  createQuote,
  createSelectionAfterEnterInput,
  createText,
  createTaskItem,
  createTaskList,
  createTable,
  isTableNode,
} from "../../src";

describe("createEnterInputTransaction", () => {
  it("splits task items and keeps the next item unchecked", () => {
    const document = createDocument([
      createTaskList([createTaskItem([createText("任务项")], true)]),
    ]);
    const input = {
      document,
      selection: {
        anchor: { offset: 2, path: [0, 0, 0] },
        focus: { offset: 2, path: [0, 0, 0] },
      },
    };
    const result = applyTransaction(document, createEnterInputTransaction(input));

    expect(result.children[0]).toMatchObject({
      children: [
        { checked: true, children: [{ text: "任务" }] },
        { checked: false, children: [{ text: "项" }] },
      ],
    });
  });

  it("outdents an empty nested item", () => {
    const document = createDocument([
      createBulletList([
        createListItem([createText("父项")], createBulletList([createListItem()])),
      ]),
    ]);
    const input = {
      document,
      selection: {
        anchor: { offset: 0, path: [0, 0, 1, 0, 0] },
        focus: { offset: 0, path: [0, 0, 1, 0, 0] },
      },
    };

    expect(createEnterInputTransaction(input).operations[0]?.type).toBe(
      "outdent_list_item",
    );
    expect(createSelectionAfterEnterInput(input).anchor.path).toEqual([0, 1, 0]);
  });

  it("splits a paragraph at the collapsed selection", () => {
    const document = createDocument([createParagraph([createText("你好世界")])]);
    const input = {
      document,
      selection: {
        anchor: { path: [0, 0], offset: 2 },
        focus: { path: [0, 0], offset: 2 },
      },
    };
    const transaction = createEnterInputTransaction(input);
    const result = applyTransaction(document, transaction);

    expect(transaction.operations[0]).toMatchObject({
      point: { path: [0, 0], offset: 2 },
      type: "split_block",
    });
    expect(result.children).toHaveLength(2);
    expect(result.children[0]?.children[0]?.text).toBe("你好");
    expect(result.children[1]?.children[0]?.text).toBe("世界");
  });

  it("moves selection to the new paragraph start", () => {
    const document = createDocument([createParagraph([createText("你好世界")])]);

    expect(
      createSelectionAfterEnterInput({
        document,
        selection: {
          anchor: { path: [0, 0], offset: 2 },
          focus: { path: [0, 0], offset: 2 },
        },
      }),
    ).toEqual({
      anchor: { path: [1, 0], offset: 0 },
      focus: { path: [1, 0], offset: 0 },
    });
  });

  it("splits a paragraph inside a table cell", () => {
    const table = createTable(1, 1);
    table.children[0]!.children[0]!.children = [
      createParagraph([createText("单元格")]),
    ];
    const document = createDocument([table]);
    const input = {
      document,
      selection: {
        anchor: { path: [0, 0, 0, 0, 0], offset: 2 },
        focus: { path: [0, 0, 0, 0, 0], offset: 2 },
      },
    };
    const result = applyTransaction(document, createEnterInputTransaction(input));
    const resultTable = result.children[0];

    expect(isTableNode(resultTable)).toBe(true);

    if (!isTableNode(resultTable)) {
      throw new Error("expected table result");
    }

    expect(
      resultTable.children[0]?.children[0]?.children.map(
        (paragraph) => paragraph.children[0]?.text,
      ),
    ).toEqual(["单元", "格"]);
    expect(createSelectionAfterEnterInput(input).anchor).toEqual({
      path: [0, 0, 0, 1, 0],
      offset: 0,
    });
  });

  it("splits at the start of a paragraph", () => {
    const document = createDocument([createParagraph([createText("你好")])]);
    const result = applyTransaction(
      document,
      createEnterInputTransaction({
        document,
        selection: {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 0 },
        },
      }),
    );

    expect(result.children[0]?.children[0]?.text).toBe("");
    expect(result.children[1]?.children[0]?.text).toBe("你好");
  });

  it("splits at the end of a paragraph", () => {
    const document = createDocument([createParagraph([createText("你好")])]);
    const result = applyTransaction(
      document,
      createEnterInputTransaction({
        document,
        selection: {
          anchor: { path: [0, 0], offset: 2 },
          focus: { path: [0, 0], offset: 2 },
        },
      }),
    );

    expect(result.children[0]?.children[0]?.text).toBe("你好");
    expect(result.children[1]?.children[0]?.text).toBe("");
  });

  it("creates a new paragraph from an empty paragraph", () => {
    const document = createDocument([createParagraph([createText("")])]);
    const result = applyTransaction(
      document,
      createEnterInputTransaction({
        document,
        selection: {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 0 },
        },
      }),
    );

    expect(result.children).toHaveLength(2);
    expect(result.children[0]?.children[0]?.text).toBe("");
    expect(result.children[1]?.children[0]?.text).toBe("");
  });

  it("exits an empty quote without adding another block", () => {
    const document = createDocument([createQuote()]);
    const input = {
      document,
      selection: {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [0, 0], offset: 0 },
      },
    };
    const transaction = createEnterInputTransaction(input);

    expect(transaction.operations).toEqual([
      { block: { type: "paragraph" }, path: [0], type: "set_block_type" },
    ]);
    expect(applyTransaction(document, transaction)).toEqual(
      createDocument([createParagraph()]),
    );
    expect(createSelectionAfterEnterInput(input)).toEqual(input.selection);
  });

  it("keeps non-empty quotes split as quotes", () => {
    const document = createDocument([createQuote([createText("引用")])]);
    const input = {
      document,
      selection: {
        anchor: { path: [0, 0], offset: 2 },
        focus: { path: [0, 0], offset: 2 },
      },
    };

    expect(applyTransaction(document, createEnterInputTransaction(input))).toEqual(
      createDocument([
        createQuote([createText("引用")]),
        createQuote([createText("")]),
      ]),
    );
  });

  it("does not exit an empty quote from an invalid point", () => {
    const document = createDocument([createQuote()]);

    expect(
      createEnterInputTransaction({
        document,
        selection: {
          anchor: { path: [0, 1], offset: 0 },
          focus: { path: [0, 1], offset: 0 },
        },
      }).operations,
    ).toEqual([]);
  });

  it("does nothing for non-collapsed selections", () => {
    const document = createDocument([createParagraph([createText("你好")])]);
    const transaction = createEnterInputTransaction({
      document,
      selection: {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [0, 0], offset: 1 },
      },
    });

    expect(transaction.operations).toEqual([]);
  });

  it("inserts a newline inside a code block", () => {
    const document = createDocument([createCodeBlock([createText("const value")])]);
    const input = {
      document,
      selection: {
        anchor: { path: [0, 0], offset: 5 },
        focus: { path: [0, 0], offset: 5 },
      },
    };
    const transaction = createEnterInputTransaction(input);
    const result = applyTransaction(document, transaction);

    expect(transaction.operations).toEqual([
      { point: { path: [0, 0], offset: 5 }, text: "\n", type: "insert_text" },
    ]);
    expect(result.children[0]?.children[0]?.text).toBe("const\n value");
    expect(createSelectionAfterEnterInput(input)).toEqual({
      anchor: { path: [0, 0], offset: 6 },
      focus: { path: [0, 0], offset: 6 },
    });
  });

  it("exits a code block after a trailing empty line", () => {
    const document = createDocument([
      createCodeBlock([createText("const value = 1;\n")]),
    ]);
    const input = {
      document,
      selection: {
        anchor: { path: [0, 0], offset: 17 },
        focus: { path: [0, 0], offset: 17 },
      },
    };
    const transaction = createEnterInputTransaction(input);
    const result = applyTransaction(document, transaction);

    expect(transaction.operations.map((operation) => operation.type)).toEqual([
      "split_block",
      "set_block_type",
    ]);
    expect(result.children).toEqual([
      {
        children: [{ text: "const value = 1;\n", type: "text" }],
        type: "codeBlock",
      },
      { children: [{ text: "", type: "text" }], type: "paragraph" },
    ]);
    expect(createSelectionAfterEnterInput(input)).toEqual({
      anchor: { path: [1, 0], offset: 0 },
      focus: { path: [1, 0], offset: 0 },
    });
  });

  it("splits a non-empty list item", () => {
    const document = createDocument([
      createBulletList([createListItem([createText("项目")])]),
    ]);
    const input = {
      document,
      selection: {
        anchor: { offset: 1, path: [0, 0, 0] },
        focus: { offset: 1, path: [0, 0, 0] },
      },
    };
    const transaction = createEnterInputTransaction(input);

    expect(transaction.operations[0]?.type).toBe("split_list_item");
    expect(applyTransaction(document, transaction).children[0]).toEqual(
      createBulletList([
        createListItem([createText("项")]),
        createListItem([createText("目")]),
      ]),
    );
    expect(createSelectionAfterEnterInput(input)).toEqual({
      anchor: { offset: 0, path: [0, 1, 0] },
      focus: { offset: 0, path: [0, 1, 0] },
    });
  });

  it("exits an empty list item into a paragraph", () => {
    const document = createDocument([
      createBulletList([createListItem([createText("项目")]), createListItem()]),
    ]);
    const input = {
      document,
      selection: {
        anchor: { offset: 0, path: [0, 1, 0] },
        focus: { offset: 0, path: [0, 1, 0] },
      },
    };
    const transaction = createEnterInputTransaction(input);

    expect(transaction.operations[0]?.type).toBe("exit_list_item");
    expect(
      applyTransaction(document, transaction).children.map((node) => node.type),
    ).toEqual(["bulletList", "paragraph"]);
    expect(createSelectionAfterEnterInput(input)).toEqual({
      anchor: { offset: 0, path: [1, 0] },
      focus: { offset: 0, path: [1, 0] },
    });
  });
});
