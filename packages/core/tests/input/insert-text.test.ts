import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  createDocument,
  createInsertTextInputTransaction,
  createParagraph,
  createSelectionAfterInsertTextInput,
  createText,
} from "../../src";

describe("createInsertTextInputTransaction", () => {
  it("creates an insert text transaction from a collapsed selection", () => {
    const transaction = createInsertTextInputTransaction({
      data: "新",
      selection: {
        anchor: { path: [0, 0], offset: 2 },
        focus: { path: [0, 0], offset: 2 },
      },
    });

    expect(transaction).toEqual({
      operations: [
        {
          point: { path: [0, 0], offset: 2 },
          text: "新",
          type: "insert_text",
        },
      ],
    });
  });

  it("uses the normalized range start for reversed selections", () => {
    const transaction = createInsertTextInputTransaction({
      data: "新",
      selection: {
        anchor: { path: [0, 0], offset: 4 },
        focus: { path: [0, 0], offset: 1 },
      },
    });

    expect(transaction.operations[0]).toMatchObject({
      point: { path: [0, 0], offset: 1 },
      type: "insert_text",
    });
  });

  it("applies the transaction through the operation pipeline", () => {
    const document = createDocument([createParagraph([createText("你好")])]);
    const transaction = createInsertTextInputTransaction({
      data: "世界",
      selection: {
        anchor: { path: [0, 0], offset: 2 },
        focus: { path: [0, 0], offset: 2 },
      },
    });
    const result = applyTransaction(document, transaction);

    expect(result.children[0]?.children[0]?.text).toBe("你好世界");
  });
});

describe("createSelectionAfterInsertTextInput", () => {
  it("collapses after the inserted text", () => {
    expect(
      createSelectionAfterInsertTextInput({
        data: "世界",
        selection: {
          anchor: { path: [0, 0], offset: 2 },
          focus: { path: [0, 0], offset: 2 },
        },
      }),
    ).toEqual({
      anchor: { path: [0, 0], offset: 4 },
      focus: { path: [0, 0], offset: 4 },
    });
  });
});
