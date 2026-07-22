import { describe, expect, it } from "vitest";

import { createDocument, createParagraph, createText } from "../../src/model";
import {
  applyMergeBlock,
  createMergeBlockOperation,
  createSelectionAfterMergeBlock,
} from "../../src/operation";

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

  it("removes an empty current block when merging", () => {
    const document = createDocument([
      createParagraph([createText("你好")]),
      createParagraph([createText("")]),
    ]);
    const result = applyMergeBlock(
      document,
      createMergeBlockOperation({
        path: [1, 0],
        offset: 0,
      }),
    );

    expect(result.children[0]?.children.map((node) => node.text)).toEqual(["你好"]);
  });

  it("drops an empty previous block when merging", () => {
    const document = createDocument([
      createParagraph([createText("")]),
      createParagraph([createText("世界")]),
    ]);
    const result = applyMergeBlock(
      document,
      createMergeBlockOperation({
        path: [1, 0],
        offset: 0,
      }),
    );

    expect(result.children[0]?.children.map((node) => node.text)).toEqual(["世界"]);
  });

  it("preserves marks from both merged blocks", () => {
    const document = createDocument([
      createParagraph([createText("你好", { bold: true })]),
      createParagraph([createText("世界", { italic: true })]),
    ]);
    const result = applyMergeBlock(
      document,
      createMergeBlockOperation({
        path: [1, 0],
        offset: 0,
      }),
    );

    expect(result.children[0]?.children.map((node) => node.marks)).toEqual([
      { bold: true },
      { italic: true },
    ]);
  });

  it("throws when merging the first block", () => {
    const document = createDocument([createParagraph([createText("你好")])]);

    expect(() =>
      applyMergeBlock(
        document,
        createMergeBlockOperation({
          path: [0, 0],
          offset: 0,
        }),
      ),
    ).toThrow("merge block point must be at the start of a non-first block");
  });

  it("throws when the point is not at block start", () => {
    const document = createDocument([
      createParagraph([createText("你好")]),
      createParagraph([createText("世界")]),
    ]);

    expect(() =>
      applyMergeBlock(
        document,
        createMergeBlockOperation({
          path: [1, 0],
          offset: 1,
        }),
      ),
    ).toThrow("merge block point must be at the start of a non-first block");
  });

  it("throws when the point is not in the first text node", () => {
    const document = createDocument([
      createParagraph([createText("你好")]),
      createParagraph([createText("世"), createText("界")]),
    ]);

    expect(() =>
      applyMergeBlock(
        document,
        createMergeBlockOperation({
          path: [1, 1],
          offset: 0,
        }),
      ),
    ).toThrow("merge block point must be at the start of a non-first block");
  });
});

describe("createSelectionAfterMergeBlock", () => {
  it("creates a collapsed selection at the previous block end", () => {
    const document = createDocument([
      createParagraph([createText("你"), createText("好")]),
      createParagraph([createText("世界")]),
    ]);
    const operation = createMergeBlockOperation({
      path: [1, 0],
      offset: 0,
    });

    expect(createSelectionAfterMergeBlock(document, operation)).toEqual({
      anchor: {
        path: [0, 1],
        offset: 1,
      },
      focus: {
        path: [0, 1],
        offset: 1,
      },
    });
  });

  it("uses offset zero when the previous block is empty", () => {
    const document = createDocument([
      createParagraph([createText("")]),
      createParagraph([createText("世界")]),
    ]);
    const operation = createMergeBlockOperation({
      path: [1, 0],
      offset: 0,
    });

    expect(createSelectionAfterMergeBlock(document, operation)).toEqual({
      anchor: {
        path: [0, 0],
        offset: 0,
      },
      focus: {
        path: [0, 0],
        offset: 0,
      },
    });
  });
});
