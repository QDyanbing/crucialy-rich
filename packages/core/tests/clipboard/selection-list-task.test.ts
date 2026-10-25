import { describe, expect, it } from "vitest";
import {
  createBulletList,
  createDocument,
  createListItem,
  createTaskItem,
  createTaskList,
  createText,
} from "../../src";
import { getClipboardList } from "../../src/clipboard/selection-list";

describe("task clipboard list fragments", () => {
  it("keeps selected task states and drops the final item's unselected nested tasks", () => {
    const document = createDocument([
      createTaskList([
        createTaskItem(
          [createText("前甲", { bold: true })],
          true,
          createTaskList([createTaskItem([createText("选中子项")], true)]),
        ),
        createTaskItem(
          [createText("乙后")],
          false,
          createTaskList([createTaskItem([createText("未选子项")], true)]),
        ),
      ]),
    ]);
    const original = structuredClone(document);
    expect(
      getClipboardList(document, {
        anchor: { path: [0, 0, 0], offset: 1 },
        focus: { path: [0, 1, 0], offset: 1 },
      }),
    ).toEqual(
      createTaskList([
        createTaskItem(
          [createText("甲", { bold: true })],
          true,
          createTaskList([createTaskItem([createText("选中子项")], true)]),
        ),
        createTaskItem([createText("乙")]),
      ]),
    );
    expect(document).toEqual(original);
  });

  it("rebases a nested task list without copying its parent's text or state", () => {
    const document = createDocument([
      createBulletList([
        createListItem(
          [createText("未选父项")],
          createTaskList([
            createTaskItem([createText("子甲")], true),
            createTaskItem([createText("子乙")]),
          ]),
        ),
      ]),
    ]);
    expect(
      getClipboardList(document, {
        anchor: { path: [0, 0, 1, 0, 0], offset: 0 },
        focus: { path: [0, 0, 1, 1, 0], offset: 2 },
      }),
    ).toEqual(
      createTaskList([
        createTaskItem([createText("子甲")], true),
        createTaskItem([createText("子乙")]),
      ]),
    );
  });

  it("rejects mixed task and ordinary entries instead of normalizing away selected items", () => {
    const document = createDocument([
      {
        type: "taskList",
        children: [
          createTaskItem([createText("任务")]),
          createListItem([createText("普通项")]),
        ],
      },
    ]);
    expect(
      getClipboardList(document, {
        anchor: { path: [0, 0, 0], offset: 0 },
        focus: { path: [0, 1, 0], offset: 1 },
      }),
    ).toBeUndefined();
  });
});
