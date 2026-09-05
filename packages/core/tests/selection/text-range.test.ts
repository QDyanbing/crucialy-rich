import { describe, expect, it } from "vitest";

import {
  createBulletList,
  createDivider,
  createDocument,
  createListItem,
  createParagraph,
  createText,
} from "../../src/model";
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

  it("skips void children while preserving block separators", () => {
    const documentWithDivider = createDocument([
      createParagraph([createText("上")]),
      createDivider(),
      createParagraph([createText("下")]),
    ]);

    expect(
      getTextInRange(documentWithDivider, {
        anchor: { offset: 0, path: [0, 0] },
        focus: { offset: 1, path: [2, 0] },
      }),
    ).toBe("上\n\n下");
  });

  it("reads text across list items and surrounding blocks", () => {
    const listDocument = createDocument([
      createParagraph([createText("前")]),
      createBulletList([
        createListItem([createText("项目一")]),
        createListItem([createText("项目二")]),
      ]),
      createParagraph([createText("后")]),
    ]);

    expect(
      getTextInRange(listDocument, {
        anchor: { offset: 0, path: [0, 0] },
        focus: { offset: 1, path: [2, 0] },
      }),
    ).toBe("前\n项目一\n项目二\n后");
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

  it("splits across sibling text nodes in one paragraph", () => {
    expect(
      splitTextByRange(document, {
        anchor: { path: [0, 0], offset: 3 },
        focus: { path: [0, 1], offset: 2 },
      }),
    ).toEqual({
      before: "alp",
      selected: "habe",
      after: "ta\ngamma",
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
