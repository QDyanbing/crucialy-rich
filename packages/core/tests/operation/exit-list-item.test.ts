import { describe, expect, it } from "vitest";

import {
  applyExitListItem,
  createBulletList,
  createDocument,
  createExitListItemOperation,
  createListItem,
  createOrderedList,
  createParagraph,
  createSelectionAfterExitListItem,
  createText,
} from "../../src";

describe("exit list item operation", () => {
  it("splits a list around an empty middle item", () => {
    const document = createDocument([
      createBulletList([
        createListItem([createText("前")]),
        createListItem(),
        createListItem([createText("后")]),
      ]),
    ]);
    const operation = createExitListItemOperation({
      offset: 0,
      path: [0, 1, 0],
    });

    expect(applyExitListItem(document, operation)).toEqual(
      createDocument([
        createBulletList([createListItem([createText("前")])]),
        createParagraph(),
        createBulletList([createListItem([createText("后")])]),
      ]),
    );
    expect(createSelectionAfterExitListItem(document, operation)).toEqual({
      anchor: { offset: 0, path: [1, 0] },
      focus: { offset: 0, path: [1, 0] },
    });
  });

  it("replaces a single empty item list with a paragraph", () => {
    const document = createDocument([createBulletList([createListItem()])]);
    const operation = createExitListItemOperation({
      offset: 0,
      path: [0, 0, 0],
    });

    expect(applyExitListItem(document, operation)).toEqual(
      createDocument([createParagraph()]),
    );
  });

  it("continues ordered numbering after an exited item", () => {
    const document = createDocument([
      createOrderedList(
        [
          createListItem([createText("第四项")]),
          createListItem(),
          createListItem([createText("第六项")]),
        ],
        4,
      ),
    ]);
    const operation = createExitListItemOperation({
      offset: 0,
      path: [0, 1, 0],
    });

    expect(applyExitListItem(document, operation).children).toEqual([
      createOrderedList([createListItem([createText("第四项")])], 4),
      createParagraph(),
      createOrderedList([createListItem([createText("第六项")])], 6),
    ]);
  });
});
