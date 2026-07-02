import { describe, expect, it } from "vitest";

import { createDocument, createParagraph, createText } from "../../src/model";
import { applySplitBlock, createSplitBlockOperation } from "../../src/operation";

describe("createSplitBlockOperation", () => {
  it("creates a split block operation from a point", () => {
    expect(
      createSplitBlockOperation({
        path: [0, 0],
        offset: 2,
      }),
    ).toEqual({
      point: {
        path: [0, 0],
        offset: 2,
      },
      type: "split_block",
    });
  });

  it("clones the point path when creating the operation", () => {
    const path = [0, 0];
    const operation = createSplitBlockOperation({ path, offset: 1 });

    path[0] = 9;

    expect(operation.point.path).toEqual([0, 0]);
  });
});

describe("applySplitBlock", () => {
  it("splits a paragraph in the middle of a text node", () => {
    const document = createDocument([createParagraph([createText("你好世界")])]);
    const result = applySplitBlock(
      document,
      createSplitBlockOperation({
        path: [0, 0],
        offset: 2,
      }),
    );

    expect(result.children).toHaveLength(2);
    expect(result.children[0]?.children[0]?.text).toBe("你好");
    expect(result.children[1]?.children[0]?.text).toBe("世界");
    expect(document.children).toHaveLength(1);
    expect(document.children[0]?.children[0]?.text).toBe("你好世界");
  });

  it("splits at the start of a text node", () => {
    const document = createDocument([createParagraph([createText("你好")])]);
    const result = applySplitBlock(
      document,
      createSplitBlockOperation({
        path: [0, 0],
        offset: 0,
      }),
    );

    expect(result.children[0]?.children[0]?.text).toBe("");
    expect(result.children[1]?.children[0]?.text).toBe("你好");
  });

  it("splits at the end of a text node", () => {
    const document = createDocument([createParagraph([createText("你好")])]);
    const result = applySplitBlock(
      document,
      createSplitBlockOperation({
        path: [0, 0],
        offset: 2,
      }),
    );

    expect(result.children[0]?.children[0]?.text).toBe("你好");
    expect(result.children[1]?.children[0]?.text).toBe("");
  });

  it("keeps sibling text nodes on their side of the split", () => {
    const document = createDocument([
      createParagraph([createText("甲"), createText("乙丙"), createText("丁")]),
    ]);
    const result = applySplitBlock(
      document,
      createSplitBlockOperation({
        path: [0, 1],
        offset: 1,
      }),
    );

    expect(result.children[0]?.children.map((node) => node.text)).toEqual(["甲", "乙"]);
    expect(result.children[1]?.children.map((node) => node.text)).toEqual(["丙", "丁"]);
  });

  it("throws when the point does not reference text", () => {
    const document = createDocument([createParagraph([createText("你好")])]);

    expect(() =>
      applySplitBlock(
        document,
        createSplitBlockOperation({
          path: [0],
          offset: 0,
        }),
      ),
    ).toThrow("split block point must reference a text node");
  });

  it("throws when the point offset is outside text", () => {
    const document = createDocument([createParagraph([createText("你好")])]);

    expect(() =>
      applySplitBlock(
        document,
        createSplitBlockOperation({
          path: [0, 0],
          offset: 3,
        }),
      ),
    ).toThrow("split block point must reference a text node");
  });
});
