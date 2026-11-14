// @vitest-environment jsdom
import {
  createDocument,
  createParagraph,
  createText,
  createTaskList,
  createTaskItem,
  createHistoryState,
  createHistorySnapshot,
  recordHistory,
  undoHistory,
  redoHistory,
} from "@crucialy-rich/core";
import { describe, expect, it } from "vitest";
import {
  interactionDocument,
  mountInteractionEditor,
} from "./editor-interaction-fixture";

describe("task click transactions and History", () => {
  for (const controlled of [false, true]) {
    it.each([false, true])(
      `preserves a backward=%s range in controlled=${controlled}`,
      (backward) => {
        const value = interactionDocument();
        const start = { path: [0, 0], offset: 0 },
          end = { path: [0, 0], offset: 2 };
        const selection = {
          anchor: backward ? end : start,
          focus: backward ? start : end,
        };
        const host = mountInteractionEditor({
          selection,
          ...(controlled ? { value } : {}),
        });
        window.getSelection()!.removeAllRanges();
        host.click('input[type="checkbox"]');
        const event = host.onTransaction.mock.calls[0]![0];
        expect(event.beforeSelection).toEqual(selection);
        expect(event.selection).toEqual(selection);
        expect(event.beforeSelection).not.toBe(event.selection);
        expect(event.beforeSelection.anchor.path).not.toBe(selection.anchor.path);
        expect(event.transaction.operations).toEqual([
          { type: "set_task_item_checked", path: [1, 0], checked: true },
        ]);
        expect(event).not.toHaveProperty("batch");
        if (controlled) {
          expect(host.ref.current!.getDocument()).toBe(value);
          host.rerender({ value: event.after, selection: event.selection });
        }
        const history = recordHistory({
          history: createHistoryState(),
          transaction: event.transaction,
          before: createHistorySnapshot(event.before, event.beforeSelection),
          after: createHistorySnapshot(event.after, event.selection),
        });
        expect(history.undoStack).toHaveLength(1);
        const undone = undoHistory(history)!;
        expect(undone.document).toEqual(value);
        expect(undone.selection).toEqual(selection);
        const redone = redoHistory(undone.history)!;
        expect(redone.document).toEqual(event.after);
        expect(redone.selection).toEqual(selection);
        expect(host.ref.current!.getDocument()).toEqual(event.after);
      },
    );
  }

  it("toggles a nested item without changing its parent or neighbor", () => {
    const neighbor = createTaskItem([createText("邻项")], true);
    const value = createDocument([
      createParagraph([createText("正文")]),
      createTaskList([
        createTaskItem(
          [createText("父项")],
          true,
          createTaskList([createTaskItem([createText("子项")]), neighbor]),
        ),
      ]),
    ]);
    const host = mountInteractionEditor({ value });
    host.click('input[data-crucialy-path="[1,0,1,0]"]');
    const event = host.onTransaction.mock.calls[0]![0];
    expect(event.transaction.operations[0]).toEqual({
      type: "set_task_item_checked",
      path: [1, 0, 1, 0],
      checked: true,
    });
    expect(event.after.children[1].children[0].checked).toBe(true);
    expect(event.after.children[1].children[0].nested.children[1]).toEqual(neighbor);
  });

  it("does not let a before-selection observer overwrite the committed selection or prop", () => {
    const selection = {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 2 },
    };
    const host = mountInteractionEditor({
      selection,
      onTransaction(event) {
        event.beforeSelection!.anchor.path[0] = 99;
      },
    });
    window.getSelection()!.removeAllRanges();
    host.click('input[type="checkbox"]');
    expect(host.onSelectionChange).toHaveBeenCalledExactlyOnceWith(selection);
    expect(selection.anchor.path).toEqual([0, 0]);
  });

  it.each([false, true])(
    "uses a task-local point when the host selection is invalid=%s",
    (invalid) => {
      const host = mountInteractionEditor(
        invalid
          ? {
              selection: {
                anchor: { path: [99, 0], offset: 0 },
                focus: { path: [99, 0], offset: 0 },
              },
            }
          : {},
      );
      window.getSelection()!.removeAllRanges();
      host.click('input[type="checkbox"]');
      expect(host.onTransaction.mock.calls[0]![0].selection).toEqual({
        anchor: { path: [1, 0, 0], offset: 0 },
        focus: { path: [1, 0, 0], offset: 0 },
      });
    },
  );
});
