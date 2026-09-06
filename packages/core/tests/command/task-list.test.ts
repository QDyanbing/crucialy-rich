import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecuteToggleTaskListCommand,
  createBulletList,
  createDocument,
  createListItem,
  createParagraph,
  createTaskItem,
  createTaskList,
  createText,
  isTaskListCommandActive,
  toggleBulletListCommand,
  toggleTaskListCommand,
} from "../../src";

describe("toggleTaskListCommand", () => {
  it("wraps selected paragraphs as unchecked task items", () => {
    const document = createDocument([
      createParagraph([createText("任务一")]),
      createParagraph([createText("任务二", { bold: true })]),
    ]);
    const selection = {
      anchor: { offset: 0, path: [0, 0] },
      focus: { offset: 3, path: [1, 0] },
    };
    const input = { context: { document, selection } };
    const result = toggleTaskListCommand.execute(input);
    const nextDocument = applyTransaction(document, result.transaction!);

    expect(canExecuteToggleTaskListCommand(input)).toBe(true);
    expect(nextDocument).toEqual(
      createDocument([
        createTaskList([
          createTaskItem([createText("任务一")]),
          createTaskItem([createText("任务二", { bold: true })]),
        ]),
      ]),
    );
    expect(
      isTaskListCommandActive({
        context: { document: nextDocument, selection: result.selection! },
      }),
    ).toBe(true);
  });

  it("converts standard list items to task items", () => {
    const nested = createBulletList([createListItem([createText("子项")])]);
    const document = createDocument([
      createBulletList([createListItem([createText("任务")], nested)]),
    ]);
    const selection = {
      anchor: { offset: 0, path: [0, 0, 0] },
      focus: { offset: 2, path: [0, 0, 0] },
    };
    const result = toggleTaskListCommand.execute({ context: { document, selection } });

    expect(applyTransaction(document, result.transaction!)).toEqual(
      createDocument([
        createTaskList([createTaskItem([createText("任务")], false, nested)]),
      ]),
    );
  });

  it("converts task items to standard list items", () => {
    const document = createDocument([
      createTaskList([createTaskItem([createText("完成")], true)]),
    ]);
    const selection = {
      anchor: { offset: 0, path: [0, 0, 0] },
      focus: { offset: 2, path: [0, 0, 0] },
    };
    const result = toggleBulletListCommand.execute({
      context: { document, selection },
    });

    expect(applyTransaction(document, result.transaction!)).toEqual(
      createDocument([createBulletList([createListItem([createText("完成")])])]),
    );
  });

  it("unwraps an active task list to paragraphs", () => {
    const document = createDocument([
      createTaskList([createTaskItem([createText("任务")], true)]),
    ]);
    const selection = {
      anchor: { offset: 0, path: [0, 0, 0] },
      focus: { offset: 2, path: [0, 0, 0] },
    };
    const result = toggleTaskListCommand.execute({ context: { document, selection } });

    expect(applyTransaction(document, result.transaction!)).toEqual(
      createDocument([createParagraph([createText("任务")])]),
    );
  });
});
