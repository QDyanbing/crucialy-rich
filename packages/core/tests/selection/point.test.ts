import { describe, expect, it } from "vitest";

import { createDocument, createParagraph, createText } from "../../src/model";
import { comparePoint, isValidPoint } from "../../src/selection/point";

const document = createDocument([
  createParagraph([createText("alpha"), createText("beta")]),
  createParagraph([createText("gamma")]),
]);

describe("selection point", () => {
  it("accepts offsets inside text nodes", () => {
    expect(isValidPoint(document, { path: [0, 0], offset: 0 })).toBe(true);
    expect(isValidPoint(document, { path: [0, 0], offset: 5 })).toBe(true);
  });

  it("rejects offsets outside text nodes", () => {
    expect(isValidPoint(document, { path: [], offset: 0 })).toBe(false);
    expect(isValidPoint(document, { path: [0], offset: 0 })).toBe(false);
    expect(isValidPoint(document, { path: [0, 0], offset: 6 })).toBe(false);
    expect(isValidPoint(document, { path: [0, 0], offset: -1 })).toBe(false);
    expect(isValidPoint(document, { path: [0, 0], offset: 0.5 })).toBe(false);
  });

  it("compares points by path and offset", () => {
    expect(comparePoint({ path: [0, 0], offset: 1 }, { path: [0, 0], offset: 2 })).toBe(
      -1,
    );
    expect(comparePoint({ path: [0, 1], offset: 0 }, { path: [0, 0], offset: 9 })).toBe(
      1,
    );
    expect(comparePoint({ path: [1, 0], offset: 0 }, { path: [1, 0], offset: 0 })).toBe(
      0,
    );
  });
});
