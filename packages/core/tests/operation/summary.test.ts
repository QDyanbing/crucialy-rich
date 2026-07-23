import { describe, expect, it } from "vitest";

import {
  BLOCK_OPERATION_TYPES,
  createDeleteTextOperation,
  createInsertTextOperation,
  createMergeBlockOperation,
  createSplitBlockOperation,
  createToggleMarkOperation,
  createTransaction,
  isBlockOperation,
  isTextOperation,
  OPERATION_TYPES,
  summarizeOperation,
  summarizeTransaction,
  TEXT_OPERATION_TYPES,
} from "../../src/operation";

describe("operation type registry", () => {
  it("lists the supported operation types", () => {
    expect(OPERATION_TYPES).toEqual([
      "insert_text",
      "delete_text",
      "toggle_mark",
      "split_block",
      "merge_block",
    ]);
    expect(TEXT_OPERATION_TYPES).toEqual(["insert_text", "delete_text", "toggle_mark"]);
    expect(BLOCK_OPERATION_TYPES).toEqual(["split_block", "merge_block"]);
  });
});

describe("operation scope classification", () => {
  it("detects text operations", () => {
    const insertOperation = createInsertTextOperation(
      { path: [0, 0], offset: 0 },
      "新",
    );
    const deleteOperation = createDeleteTextOperation({
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 1 },
    });
    const toggleMarkOperation = createToggleMarkOperation(
      {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [0, 0], offset: 1 },
      },
      "bold",
    );

    expect(isTextOperation(insertOperation)).toBe(true);
    expect(isTextOperation(deleteOperation)).toBe(true);
    expect(isTextOperation(toggleMarkOperation)).toBe(true);
    expect(isBlockOperation(insertOperation)).toBe(false);
  });

  it("detects block operations", () => {
    const splitOperation = createSplitBlockOperation({ path: [0, 0], offset: 1 });
    const mergeOperation = createMergeBlockOperation({ path: [1, 0], offset: 0 });

    expect(isBlockOperation(splitOperation)).toBe(true);
    expect(isBlockOperation(mergeOperation)).toBe(true);
    expect(isTextOperation(splitOperation)).toBe(false);
  });
});

describe("summarizeOperation", () => {
  it("summarizes insert text operations", () => {
    const operation = createInsertTextOperation({ path: [0, 0], offset: 1 }, "新文本");

    expect(summarizeOperation(operation)).toEqual({
      scope: "text",
      targetPath: [0, 0],
      textLength: 3,
      type: "insert_text",
    });
  });

  it("summarizes delete text operations with normalized ranges", () => {
    const operation = createDeleteTextOperation({
      anchor: { path: [0, 0], offset: 4 },
      focus: { path: [0, 0], offset: 1 },
    });

    expect(summarizeOperation(operation)).toEqual({
      collapsedRange: false,
      scope: "text",
      targetPath: [0, 0],
      textLength: 3,
      type: "delete_text",
    });
  });

  it("marks collapsed delete ranges", () => {
    const operation = createDeleteTextOperation({
      anchor: { path: [0, 0], offset: 2 },
      focus: { path: [0, 0], offset: 2 },
    });

    expect(summarizeOperation(operation)).toMatchObject({
      collapsedRange: true,
      textLength: 0,
      type: "delete_text",
    });
  });

  it("summarizes block operations", () => {
    expect(
      summarizeOperation(createSplitBlockOperation({ path: [0, 0], offset: 2 })),
    ).toEqual({
      scope: "block",
      targetPath: [0, 0],
      type: "split_block",
    });
    expect(
      summarizeOperation(createMergeBlockOperation({ path: [1, 0], offset: 0 })),
    ).toEqual({
      scope: "block",
      targetPath: [1, 0],
      type: "merge_block",
    });
  });

  it("summarizes toggle mark operations", () => {
    const operation = createToggleMarkOperation(
      {
        anchor: { path: [0, 0], offset: 3 },
        focus: { path: [0, 0], offset: 1 },
      },
      "bold",
    );

    expect(summarizeOperation(operation)).toEqual({
      collapsedRange: false,
      mark: "bold",
      scope: "text",
      targetPath: [0, 0],
      textLength: 2,
      type: "toggle_mark",
    });
  });
});

describe("summarizeTransaction", () => {
  it("summarizes operation counts and ordered operation types", () => {
    const transaction = createTransaction([
      createInsertTextOperation({ path: [0, 0], offset: 0 }, "新"),
      createDeleteTextOperation({
        anchor: { path: [0, 0], offset: 1 },
        focus: { path: [0, 0], offset: 2 },
      }),
      createToggleMarkOperation(
        {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 1 },
        },
        "bold",
      ),
      createSplitBlockOperation({ path: [0, 0], offset: 2 }),
      createMergeBlockOperation({ path: [1, 0], offset: 0 }),
    ]);

    expect(summarizeTransaction(transaction)).toEqual({
      blockOperationCount: 2,
      hasBlockOperations: true,
      hasTextOperations: true,
      operationCount: 5,
      operationTypes: [
        "insert_text",
        "delete_text",
        "toggle_mark",
        "split_block",
        "merge_block",
      ],
      textOperationCount: 3,
    });
  });

  it("summarizes empty transactions", () => {
    expect(summarizeTransaction(createTransaction())).toEqual({
      blockOperationCount: 0,
      hasBlockOperations: false,
      hasTextOperations: false,
      operationCount: 0,
      operationTypes: [],
      textOperationCount: 0,
    });
  });
});
