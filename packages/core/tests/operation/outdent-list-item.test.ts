import { describe, expect, it } from "vitest";

import {
  applyOutdentListItem,
  createBulletList,
  createDocument,
  createListItem,
  createOutdentListItemOperation,
  createSelectionAfterOutdentListItem,
  createText,
  validateDocument,
} from "../../src";

describe("outdent list item operation", () => {
  it("lifts a nested item after its parent", () => {
    const document = createDocument([
      createBulletList([
        createListItem(
          [createText("父项")],
          createBulletList([
            createListItem([createText("保留子项")]),
            createListItem([createText("提升项")]),
          ]),
        ),
        createListItem([createText("尾项")]),
      ]),
    ]);
    const operation = createOutdentListItemOperation({
      offset: 2,
      path: [0, 0, 1, 1, 0],
    });
    const result = applyOutdentListItem(document, operation);

    expect(result).toEqual(
      createDocument([
        createBulletList([
          createListItem(
            [createText("父项")],
            createBulletList([createListItem([createText("保留子项")])]),
          ),
          createListItem([createText("提升项")]),
          createListItem([createText("尾项")]),
        ]),
      ]),
    );
    expect(createSelectionAfterOutdentListItem(document, operation)).toEqual({
      anchor: { offset: 2, path: [0, 1, 0] },
      focus: { offset: 2, path: [0, 1, 0] },
    });
    expect(validateDocument(result).valid).toBe(true);
  });

  it("removes an empty nested list after lifting its only item", () => {
    const document = createDocument([
      createBulletList([
        createListItem(
          [createText("父项")],
          createBulletList([createListItem([createText("唯一子项")])]),
        ),
      ]),
    ]);
    const result = applyOutdentListItem(
      document,
      createOutdentListItemOperation({ offset: 0, path: [0, 0, 1, 0, 0] }),
    );

    expect(result).toEqual(
      createDocument([
        createBulletList([
          createListItem([createText("父项")]),
          createListItem([createText("唯一子项")]),
        ]),
      ]),
    );
  });

  it("rejects top-level items", () => {
    const document = createDocument([
      createBulletList([createListItem([createText("顶层")])]),
    ]);

    expect(() =>
      applyOutdentListItem(
        document,
        createOutdentListItemOperation({ offset: 0, path: [0, 0, 0] }),
      ),
    ).toThrow(RangeError);
  });
});
