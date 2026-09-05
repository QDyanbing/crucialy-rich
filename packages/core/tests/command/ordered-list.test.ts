import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  createBulletList,
  createDocument,
  createListItem,
  createOrderedList,
  createParagraph,
  createText,
  isOrderedListCommandActive,
  toggleOrderedListCommand,
} from "../../src";

describe("toggleOrderedListCommand", () => {
  it("wraps paragraphs as an ordered list", () => {
    const document = createDocument([
      createParagraph([createText("一")]),
      createParagraph([createText("二", { italic: true })]),
    ]);
    const selection = {
      anchor: { offset: 0, path: [0, 0] },
      focus: { offset: 1, path: [1, 0] },
    };
    const result = toggleOrderedListCommand.execute({
      context: { document, selection },
    });

    expect(applyTransaction(document, result.transaction!)).toEqual(
      createDocument([
        createOrderedList([
          createListItem([createText("一")]),
          createListItem([createText("二", { italic: true })]),
        ]),
      ]),
    );
  });

  it("switches a bullet list to an ordered list in place", () => {
    const document = createDocument([
      createBulletList([createListItem([createText("项目")])]),
    ]);
    const selection = {
      anchor: { offset: 0, path: [0, 0, 0] },
      focus: { offset: 2, path: [0, 0, 0] },
    };
    const result = toggleOrderedListCommand.execute({
      context: { document, selection },
    });
    const nextDocument = applyTransaction(document, result.transaction!);

    expect(nextDocument.children[0]).toEqual(
      createOrderedList([createListItem([createText("项目")])]),
    );
    expect(result.selection).toEqual(selection);
    expect(
      isOrderedListCommandActive({
        context: { document: nextDocument, selection },
      }),
    ).toBe(true);
  });

  it("unwraps an ordered list when already active", () => {
    const document = createDocument([
      createOrderedList([createListItem([createText("项目")])]),
    ]);
    const selection = {
      anchor: { offset: 0, path: [0, 0, 0] },
      focus: { offset: 2, path: [0, 0, 0] },
    };
    const result = toggleOrderedListCommand.execute({
      context: { document, selection },
    });

    expect(applyTransaction(document, result.transaction!)).toEqual(
      createDocument([createParagraph([createText("项目")])]),
    );
  });
});
