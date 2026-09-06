import { createListItem, createTaskItem, type DocumentNode } from "../model";
import type { Point, RangeSelection } from "../selection";
import { getListItemTarget, updateListAtPath } from "./list-item-path";
import type { SplitListItemOperation } from "./types";

export function createSplitListItemOperation(point: Point): SplitListItemOperation {
  return {
    point: { offset: point.offset, path: [...point.path] },
    type: "split_list_item",
  };
}

function getTarget(document: DocumentNode, operation: SplitListItemOperation) {
  const target = getListItemTarget(document, operation.point);

  if (!target) {
    throw new RangeError("split list item point must reference list item text");
  }

  return target;
}

export function applySplitListItem(
  document: DocumentNode,
  operation: SplitListItemOperation,
): DocumentNode {
  const { item, itemIndex, listPath, textIndex } = getTarget(document, operation);
  const text = item.children[textIndex]!;
  const left = { ...text, text: text.text.slice(0, operation.point.offset) };
  const right = { ...text, text: text.text.slice(operation.point.offset) };
  const leftChildren = [...item.children.slice(0, textIndex), left];
  const rightChildren = [right, ...item.children.slice(textIndex + 1)];
  const leftItem =
    item.type === "taskItem"
      ? createTaskItem(leftChildren, item.checked)
      : createListItem(leftChildren);
  const rightItem =
    item.type === "taskItem"
      ? createTaskItem(rightChildren, false, item.nested)
      : createListItem(rightChildren, item.nested);

  return updateListAtPath(document, listPath, (list) => ({
    ...list,
    children: [
      ...list.children.slice(0, itemIndex),
      leftItem,
      rightItem,
      ...list.children.slice(itemIndex + 1),
    ],
  }));
}

export function createSelectionAfterSplitListItem(
  operation: SplitListItemOperation,
): RangeSelection {
  const itemIndex = operation.point.path.at(-2) ?? 0;
  const point = {
    offset: 0,
    path: [...operation.point.path.slice(0, -2), itemIndex + 1, 0],
  };

  return {
    anchor: point,
    focus: { offset: point.offset, path: [...point.path] },
  };
}
