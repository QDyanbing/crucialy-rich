import { describe, expect, it } from "vitest";

import {
  BLOCK_OPERATION_TYPES,
  createDeleteTextOperation,
  createInsertTextOperation,
  createMergeBlockOperation,
  createSplitBlockOperation,
  isBlockOperation,
  isTextOperation,
  OPERATION_TYPES,
  TEXT_OPERATION_TYPES,
} from "../../src/operation";

describe("operation type registry", () => {
  it("lists the supported operation types", () => {
    expect(OPERATION_TYPES).toEqual([
      "insert_text",
      "delete_text",
      "split_block",
      "merge_block",
    ]);
    expect(TEXT_OPERATION_TYPES).toEqual(["insert_text", "delete_text"]);
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

    expect(isTextOperation(insertOperation)).toBe(true);
    expect(isTextOperation(deleteOperation)).toBe(true);
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
