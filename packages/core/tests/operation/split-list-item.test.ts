import { describe, expect, it } from "vitest";

import {
  applySplitListItem,
  createBulletList,
  createDocument,
  createListItem,
  createSelectionAfterSplitListItem,
  createSplitListItemOperation,
  createText,
  createTaskItem,
  createTaskList,
} from "../../src";

describe("split list item operation", () => {
  it("splits an item and preserves text marks", () => {
    const document = createDocument([
      createBulletList([
        createListItem([createText("项目", { bold: true })]),
        createListItem([createText("尾项")]),
      ]),
    ]);
    const operation = createSplitListItemOperation({
      offset: 1,
      path: [0, 0, 0],
    });
    const result = applySplitListItem(document, operation);

    expect(result.children[0]).toEqual(
      createBulletList([
        createListItem([createText("项", { bold: true })]),
        createListItem([createText("目", { bold: true })]),
        createListItem([createText("尾项")]),
      ]),
    );
    expect(createSelectionAfterSplitListItem(operation)).toEqual({
      anchor: { offset: 0, path: [0, 1, 0] },
      focus: { offset: 0, path: [0, 1, 0] },
    });
  });

  it("rejects points outside list items", () => {
    const document = createDocument([
      createBulletList([createListItem([createText("项目")])]),
    ]);

    expect(() =>
      applySplitListItem(
        document,
        createSplitListItemOperation({ offset: 0, path: [0, 0] }),
      ),
    ).toThrow(RangeError);
  });

  it("splits task items and starts the new task unchecked", () => {
    const document = createDocument([
      createTaskList([createTaskItem([createText("任务项")], true)]),
    ]);
    const operation = createSplitListItemOperation({ offset: 2, path: [0, 0, 0] });

    expect(applySplitListItem(document, operation)).toEqual(
      createDocument([
        createTaskList([
          createTaskItem([createText("任务")], true),
          createTaskItem([createText("项")]),
        ]),
      ]),
    );
  });

  it("splits nested list items without losing their subtree", () => {
    const deep = createBulletList([createListItem([createText("深层")])]);
    const document = createDocument([
      createBulletList([
        createListItem(
          [createText("父项")],
          createBulletList([createListItem([createText("子项目")], deep)]),
        ),
      ]),
    ]);
    const operation = createSplitListItemOperation({
      offset: 1,
      path: [0, 0, 1, 0, 0],
    });
    const result = applySplitListItem(document, operation);

    expect(result.children[0]).toMatchObject({
      children: [
        {
          nested: {
            children: [
              { children: [{ text: "子" }] },
              { children: [{ text: "项目" }], nested: deep },
            ],
          },
        },
      ],
    });
    expect(createSelectionAfterSplitListItem(operation).anchor.path).toEqual([
      0, 0, 1, 1, 0,
    ]);
  });
});
