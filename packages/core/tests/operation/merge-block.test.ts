import { describe, expect, it } from "vitest";

import { createDocument, createParagraph, createText } from "../../src/model";
import { applyMergeBlock, createMergeBlockOperation } from "../../src/operation";

describe("createMergeBlockOperation", () => {
  it("creates a merge block operation from a point", () => {
    expect(
      createMergeBlockOperation({
        path: [1, 0],
        offset: 0,
      }),
    ).toEqual({
      point: {
        path: [1, 0],
        offset: 0,
      },
      type: "merge_block",
    });
  });

  it("clones the point path when creating the operation", () => {
    const path = [1, 0];
    const operation = createMergeBlockOperation({ path, offset: 0 });

    path[0] = 9;

    expect(operation.point.path).toEqual([1, 0]);
  });
});

describe("applyMergeBlock", () => {
  it("merges a block into its previous block", () => {
    const document = createDocument([
      createParagraph([createText("你好")]),
      createParagraph([createText("世界")]),
    ]);
    const result = applyMergeBlock(
      document,
      createMergeBlockOperation({
        path: [1, 0],
        offset: 0,
      }),
    );

    expect(result.children).toHaveLength(1);
    expect(result.children[0]?.children.map((node) => node.text)).toEqual([
      "你好",
      "世界",
    ]);
    expect(document.children).toHaveLength(2);
  });
});
