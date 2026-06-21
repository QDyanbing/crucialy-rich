import { describe, expect, it } from "vitest";

import { createDocument, createParagraph, createText } from "../../src/model";
import { getTextInRange, splitTextByRange } from "../../src/selection/text-range";

const document = createDocument([
  createParagraph([createText("alpha"), createText("beta")]),
  createParagraph([createText("gamma")]),
]);

describe("getTextInRange", () => {
  it("reads text inside one text node", () => {
    expect(
      getTextInRange(document, {
        anchor: { path: [0, 0], offset: 1 },
        focus: { path: [0, 0], offset: 4 },
      }),
    ).toBe("lph");
  });

  it("reads text across sibling text nodes", () => {
    expect(
      getTextInRange(document, {
        anchor: { path: [0, 0], offset: 3 },
        focus: { path: [0, 1], offset: 2 },
      }),
    ).toBe("habe");
  });

  it("reads text across paragraphs with a newline separator", () => {
    expect(
      getTextInRange(document, {
        anchor: { path: [0, 1], offset: 2 },
        focus: { path: [1, 0], offset: 3 },
      }),
    ).toBe("ta\ngam");
  });

  it("supports backward ranges", () => {
    expect(
      getTextInRange(document, {
        anchor: { path: [0, 1], offset: 2 },
        focus: { path: [0, 0], offset: 3 },
      }),
    ).toBe("habe");
  });

  it("throws when a point is invalid", () => {
    expect(() =>
      getTextInRange(document, {
        anchor: { path: [0], offset: 0 },
        focus: { path: [0, 0], offset: 1 },
      }),
    ).toThrow(RangeError);
  });
});

describe("splitTextByRange", () => {
  it("splits one text node", () => {
    expect(
      splitTextByRange(document, {
        anchor: { path: [0, 0], offset: 1 },
        focus: { path: [0, 0], offset: 4 },
      }),
    ).toEqual({
      before: "a",
      selected: "lph",
      after: "abeta\ngamma",
    });
  });

  it("splits across paragraphs", () => {
    expect(
      splitTextByRange(document, {
        anchor: { path: [0, 1], offset: 2 },
        focus: { path: [1, 0], offset: 3 },
      }),
    ).toEqual({
      before: "alphabe",
      selected: "ta\ngam",
      after: "ma",
    });
  });
});
