import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  createCodeBlock,
  createDocument,
  createEnterInputTransaction,
  createParagraph,
  createSelectionAfterEnterInput,
  createText,
} from "../../src";

describe("createEnterInputTransaction", () => {
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
});
