import { describe, expect, it } from "vitest";

import {
  createDocument,
  createParagraph,
  createText,
  getSelectedBlockIndexes,
} from "../../src";

const document = createDocument([
  createParagraph([createText("第一段")]),
  createParagraph([createText("第二段"), createText("补充")]),
  createParagraph([createText("第三段")]),
]);

describe("getSelectedBlockIndexes", () => {
  it("returns one index for a selection inside one block", () => {
    expect(
      getSelectedBlockIndexes({
        context: {
          document,
          selection: {
            anchor: { path: [1, 0], offset: 1 },
            focus: { path: [1, 1], offset: 1 },
          },
        },
      }),
    ).toEqual([1]);
  });

  it("returns every index in a forward multi-block selection", () => {
    expect(
      getSelectedBlockIndexes({
        context: {
          document,
          selection: {
            anchor: { path: [0, 0], offset: 2 },
            focus: { path: [2, 0], offset: 1 },
          },
        },
      }),
    ).toEqual([0, 1, 2]);
  });

  it("normalizes a reverse multi-block selection", () => {
    expect(
      getSelectedBlockIndexes({
        context: {
          document,
          selection: {
            anchor: { path: [2, 0], offset: 2 },
            focus: { path: [0, 0], offset: 1 },
          },
        },
      }),
    ).toEqual([0, 1, 2]);
  });

  it("returns undefined without a selection", () => {
    expect(getSelectedBlockIndexes({ context: { document } })).toBeUndefined();
  });

  it("returns undefined when either point is invalid", () => {
    expect(
      getSelectedBlockIndexes({
        context: {
          document,
          selection: {
            anchor: { path: [0, 0], offset: 4 },
            focus: { path: [3, 0], offset: 0 },
          },
        },
      }),
    ).toBeUndefined();
    expect(
      getSelectedBlockIndexes({
        context: {
          document,
          selection: {
            anchor: { path: [0, 0], offset: 5 },
            focus: { path: [2, 0], offset: 0 },
          },
        },
      }),
    ).toBeUndefined();
  });
});
