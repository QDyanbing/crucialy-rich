import { describe, expect, it } from "vitest";

import {
  createBulletList,
  createDocument,
  createListItem,
  createParagraph,
  createTableCell,
  createTableRow,
  createText,
} from "../../src/model";
import {
  getPointAtTextContainerOffset,
  getTextContainerOffset,
  isSameTextContainer,
} from "../../src/selection";

describe("text container offsets", () => {
  const document = createDocument([
    createBulletList([createListItem([createText("列"), createText("表项")])]),
    {
      type: "table",
      children: [
        createTableRow([
          createTableCell([createParagraph([createText("单"), createText("元格")])]),
        ]),
      ],
    },
  ]);

  it("maps list item points through a shared text offset", () => {
    expect(getTextContainerOffset(document, { offset: 1, path: [0, 0, 1] })).toBe(2);
    expect(getPointAtTextContainerOffset(document, [0, 0], 2)).toEqual({
      offset: 1,
      path: [0, 0, 1],
    });
  });

  it("maps table paragraph points through a shared text offset", () => {
    const containerPath = [1, 0, 0, 0];

    expect(
      getTextContainerOffset(document, { offset: 1, path: [...containerPath, 1] }),
    ).toBe(2);
    expect(
      getPointAtTextContainerOffset(document, containerPath, 1, {
        affinity: "forward",
      }),
    ).toEqual({ offset: 0, path: [...containerPath, 1] });
  });

  it("compares point containers without depending on text node paths", () => {
    expect(
      isSameTextContainer(
        { offset: 0, path: [0, 0, 0] },
        { offset: 1, path: [0, 0, 1] },
      ),
    ).toBe(true);
    expect(
      isSameTextContainer(
        { offset: 0, path: [0, 0, 0] },
        { offset: 0, path: [1, 0, 0, 0, 0] },
      ),
    ).toBe(false);
  });
});
