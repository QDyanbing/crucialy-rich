import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  createBulletList,
  createDocument,
  createListItem,
  createOrderedList,
  createTaskItem,
  createTaskList,
  createText,
  getNodeAtPath,
  parsePlainText,
  pasteCommand,
  validateDocument,
  type ListNode,
} from "../../src";

describe("plain text paste in nested lists", () => {
  it.each([2, 3])(
    "pastes at depth %i without changing ancestor or sibling lists",
    (depth) => {
      let list: ListNode = createOrderedList(
        [createListItem([createText("开旧尾")]), createListItem([createText("邻项")])],
        7,
      );
      for (let level = 1; level < depth; level += 1) {
        list = createBulletList([createListItem([createText(`父项${level}`)], list)]);
      }
      const document = createDocument([list]);
      const snapshot = structuredClone(document);
      const listPath = [0, ...Array.from({ length: depth - 1 }, () => [0, 1]).flat()];
      const pointPath = [...listPath, 0, 0];
      const result = pasteCommand.execute({
        context: {
          document,
          selection: {
            anchor: { path: pointPath, offset: 2 },
            focus: { path: pointPath, offset: 1 },
          },
        },
        payload: { fragment: parsePlainText("甲\n乙")! },
      });
      const next = applyTransaction(document, result.transaction!);

      expect(getNodeAtPath(next, listPath)).toEqual(
        createOrderedList(
          [
            createListItem([createText("开甲")]),
            createListItem([createText("乙尾")]),
            createListItem([createText("邻项")]),
          ],
          7,
        ),
      );
      expect(result.selection?.anchor).toEqual({
        path: [...listPath, 1, 0],
        offset: 1,
      });
      for (let level = 1; level < depth; level += 1) {
        expect(getNodeAtPath(next, listPath.slice(0, level * 2))).toMatchObject({
          children: [createText(`父项${depth - level}`)],
        });
      }
      expect(validateDocument(next).valid).toBe(true);
      expect(document).toEqual(snapshot);
    },
  );

  it("moves an existing child list to the last pasted item with the retained suffix", () => {
    const nested = createOrderedList([createListItem([createText("原子项")])], 9);
    const document = createDocument([
      createBulletList([
        createListItem([createText("开旧尾", { bold: true })], nested),
        createListItem([createText("邻项")]),
      ]),
    ]);
    const point = { path: [0, 0, 0], offset: 1 };
    const result = pasteCommand.execute({
      context: { document, selection: { anchor: point, focus: point } },
      payload: { fragment: parsePlainText("甲\n\n乙")! },
    });

    expect(applyTransaction(document, result.transaction!)).toEqual(
      createDocument([
        createBulletList([
          createListItem([createText("开甲", { bold: true })]),
          createListItem([createText("", { bold: true })]),
          createListItem([createText("乙旧尾", { bold: true })], nested),
          createListItem([createText("邻项")]),
        ]),
      ]),
    );
    expect(result.selection?.anchor).toEqual({ path: [0, 2, 0], offset: 1 });
  });

  it("preserves a nested task's state, marks and descendants while adding unchecked items", () => {
    const nested = createBulletList([createListItem([createText("原子项")])]);
    const tasks = createTaskList([
      createTaskItem(
        [createText("保", { bold: true }), createText("删除"), createText("尾")],
        true,
        nested,
      ),
      createTaskItem([createText("邻任务")], true),
    ]);
    const document = createDocument([
      createBulletList([createListItem([createText("父项")], tasks)]),
    ]);
    const result = pasteCommand.execute({
      context: {
        document,
        selection: {
          anchor: { path: [0, 0, 1, 0, 1], offset: 0 },
          focus: { path: [0, 0, 1, 0, 2], offset: 0 },
        },
      },
      payload: { fragment: parsePlainText("甲\n乙")! },
    });
    const next = applyTransaction(document, result.transaction!);

    expect(getNodeAtPath(next, [0, 0, 1])).toEqual(
      createTaskList([
        createTaskItem([createText("保甲", { bold: true })], true),
        createTaskItem(
          [createText("乙", { bold: true }), createText("尾")],
          false,
          nested,
        ),
        createTaskItem([createText("邻任务")], true),
      ]),
    );
    expect(result.selection?.anchor).toEqual({ path: [0, 0, 1, 1, 0], offset: 1 });
    expect(validateDocument(next).valid).toBe(true);
  });
});
