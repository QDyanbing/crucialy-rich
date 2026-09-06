import { describe, expect, it } from "vitest";

import {
  applySetTaskItemChecked,
  createDocument,
  createSetTaskItemCheckedOperation,
  createTaskItem,
  createTaskList,
  createText,
  validateDocument,
} from "../../src";

describe("set task item checked operation", () => {
  it("updates a top-level task item", () => {
    const document = createDocument([
      createTaskList([createTaskItem([createText("任务")])]),
    ]);
    const operation = createSetTaskItemCheckedOperation([0, 0], true);
    const result = applySetTaskItemChecked(document, operation);

    expect(result.children[0]).toMatchObject({
      children: [{ checked: true, type: "taskItem" }],
      type: "taskList",
    });
    expect(document.children[0]).toMatchObject({
      children: [{ checked: false }],
    });
    expect(validateDocument(result).valid).toBe(true);
  });

  it("updates a nested task item", () => {
    const document = createDocument([
      createTaskList([
        createTaskItem(
          [createText("父任务")],
          false,
          createTaskList([createTaskItem([createText("子任务")])]),
        ),
      ]),
    ]);
    const result = applySetTaskItemChecked(
      document,
      createSetTaskItemCheckedOperation([0, 0, 1, 0], true),
    );

    expect(result.children[0]).toMatchObject({
      children: [{ nested: { children: [{ checked: true, type: "taskItem" }] } }],
    });
  });

  it("rejects paths that do not reference task items", () => {
    const document = createDocument([
      createTaskList([createTaskItem([createText("任务")])]),
    ]);

    expect(() =>
      applySetTaskItemChecked(
        document,
        createSetTaskItemCheckedOperation([0, 0, 0], true),
      ),
    ).toThrow(RangeError);
  });
});
