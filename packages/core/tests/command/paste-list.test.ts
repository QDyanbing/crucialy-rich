import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecutePasteCommand,
  createBulletList,
  createDocument,
  createListItem,
  createOrderedList,
  createParagraph,
  createTaskItem,
  createTaskList,
  createText,
  parsePlainText,
  pasteCommand,
  validateDocument,
} from "../../src";

describe("plain text paste inside one list item", () => {
  it.each([
    createBulletList([
      createListItem([createText("开旧尾")]),
      createListItem([createText("邻项")]),
    ]),
    createOrderedList(
      [createListItem([createText("开旧尾")]), createListItem([createText("邻项")])],
      4,
    ),
    createTaskList([
      createTaskItem([createText("开旧尾")], true),
      createTaskItem([createText("邻项")], false),
    ]),
  ])("inserts a line at a $type caret without replacing the item", (list) => {
    const document = createDocument([createParagraph([createText("前方")]), list]);
    const snapshot = structuredClone(document);
    const point = { path: [1, 0, 0], offset: 1 };
    const input = {
      context: { document, selection: { anchor: point, focus: point } },
      payload: { fragment: parsePlainText("新")! },
    };
    const result = pasteCommand.execute(input);
    const next = applyTransaction(document, result.transaction!);

    expect(canExecutePasteCommand(input)).toBe(true);
    expect(result.transaction?.operations.map((operation) => operation.type)).toEqual([
      "insert_text",
    ]);
    expect(next.children[1]).toEqual({
      ...list,
      children: [
        { ...list.children[0], children: [createText("开新旧尾")] },
        list.children[1],
      ],
    });
    expect(result.selection).toEqual({
      anchor: { path: [1, 0, 0], offset: 2 },
      focus: { path: [1, 0, 0], offset: 2 },
    });
    expect(validateDocument(next).valid).toBe(true);
    expect(document).toEqual(snapshot);
  });

  it.each(["forward", "backward"])(
    "replaces a %s range across marked text",
    (direction) => {
      const document = createDocument([
        createBulletList([
          createListItem([
            createText("保", { bold: true }),
            createText("删除", { italic: true }),
            createText("尾"),
          ]),
          createListItem([createText("邻项")]),
        ]),
      ]);
      const start = { path: [0, 0, 1], offset: 0 };
      const end = { path: [0, 0, 2], offset: 0 };
      const result = pasteCommand.execute({
        context: {
          document,
          selection: {
            anchor: direction === "forward" ? start : end,
            focus: direction === "forward" ? end : start,
          },
        },
        payload: { fragment: parsePlainText("新")! },
      });

      expect(result.transaction?.operations.map((operation) => operation.type)).toEqual(
        ["delete_text", "insert_text"],
      );
      expect(applyTransaction(document, result.transaction!)).toEqual(
        createDocument([
          createBulletList([
            createListItem([createText("保新", { bold: true }), createText("尾")]),
            createListItem([createText("邻项")]),
          ]),
        ]),
      );
      expect(result.selection?.anchor).toEqual({ path: [0, 0, 0], offset: 2 });
    },
  );
});
