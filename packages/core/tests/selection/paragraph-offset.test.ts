import { describe, expect, it } from "vitest";

import {
  createDocument,
  createHeading,
  createParagraph,
  createQuote,
  createText,
} from "../../src/model";
import {
  getBlockTextOffset,
  getParagraphTextOffset,
  getPointAtBlockTextOffset,
  getPointAtParagraphTextOffset,
} from "../../src/selection/paragraph-offset";

const document = createDocument([
  createParagraph([createText("alpha"), createText("beta"), createText("gamma")]),
]);

describe("getParagraphTextOffset", () => {
  it("reads a point as a paragraph-local text offset", () => {
    expect(
      getParagraphTextOffset(document, {
        offset: 2,
        path: [0, 1],
      }),
    ).toBe(7);
  });

  it("returns undefined for invalid points", () => {
    expect(
      getParagraphTextOffset(document, {
        offset: 99,
        path: [0, 0],
      }),
    ).toBeUndefined();
  });
});

describe("getPointAtParagraphTextOffset", () => {
  it("maps a paragraph-local text offset back to a point", () => {
    expect(getPointAtParagraphTextOffset(document, 0, 8)).toEqual({
      offset: 3,
      path: [0, 1],
    });
  });

  it("uses backward affinity at text node boundaries by default", () => {
    expect(getPointAtParagraphTextOffset(document, 0, 5)).toEqual({
      offset: 5,
      path: [0, 0],
    });
  });

  it("can use forward affinity at text node boundaries", () => {
    expect(
      getPointAtParagraphTextOffset(document, 0, 5, { affinity: "forward" }),
    ).toEqual({
      offset: 0,
      path: [0, 1],
    });
  });

  it("returns undefined for invalid offsets", () => {
    expect(getPointAtParagraphTextOffset(document, 9, 0)).toBeUndefined();
    expect(getPointAtParagraphTextOffset(document, 0, 99)).toBeUndefined();
  });
});

describe("block text offsets", () => {
  it.each([
    ["heading", createHeading(2, [createText("alpha"), createText("beta")])],
    ["quote", createQuote([createText("alpha"), createText("beta")])],
  ] as const)("maps offsets inside a %s", (_name, block) => {
    const blockDocument = createDocument([block]);

    expect(getBlockTextOffset(blockDocument, { offset: 2, path: [0, 1] })).toBe(7);
    expect(getPointAtBlockTextOffset(blockDocument, 0, 7)).toEqual({
      offset: 2,
      path: [0, 1],
    });
  });
});
