import { describe, expect, it } from "vitest";

import {
  applyUnwrapListItem,
  createDocument,
  createListItem,
  createOrderedList,
  createParagraph,
  createText,
  createUnwrapListItemOperation,
} from "../../src";

describe("unwrap list item operation", () => {
  it("continues ordered numbering after an unwrapped item", () => {
    const document = createDocument([
      createOrderedList(
        [
          createListItem([createText("第四项")]),
          createListItem([createText("第五项")]),
          createListItem([createText("第六项")]),
        ],
        4,
      ),
    ]);
    const operation = createUnwrapListItemOperation({
      offset: 0,
      path: [0, 1, 0],
    });

    expect(applyUnwrapListItem(document, operation).children).toEqual([
      createOrderedList([createListItem([createText("第四项")])], 4),
      createParagraph([createText("第五项")]),
      createOrderedList([createListItem([createText("第六项")])], 6),
    ]);
  });
});
