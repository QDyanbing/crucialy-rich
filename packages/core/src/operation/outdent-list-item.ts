import type { DocumentNode, ListItemNode, ListNode } from "../model";
import type { Point, RangeSelection } from "../selection";
import { getListItemTarget, updateListAtPath } from "./list-item-path";
import type { OutdentListItemOperation } from "./types";

export function createOutdentListItemOperation(point: Point): OutdentListItemOperation {
  return {
    point: { offset: point.offset, path: [...point.path] },
    type: "outdent_list_item",
  };
}

function removeNestedList(item: ListItemNode): ListItemNode {
  const result = { ...item };

  delete result.nested;
  return result;
}

function getOutdentTarget(document: DocumentNode, operation: OutdentListItemOperation) {
  const target = getListItemTarget(document, operation.point);

  if (!target || target.listPath.length === 1) {
    throw new RangeError("outdent list item requires a nested list item");
  }

  const parentListPath = target.listPath.slice(0, -2);
  const parentItemIndex = target.listPath.at(-2)!;

  return { ...target, parentItemIndex, parentListPath };
}

export function canOutdentListItem(document: DocumentNode, point: Point): boolean {
  const target = getListItemTarget(document, point);

  return Boolean(target && target.listPath.length > 1);
}

function outdentListItem(
  parentList: ListNode,
  parentItemIndex: number,
  itemIndex: number,
): ListNode {
  const parentItem = parentList.children[parentItemIndex]!;
  const nestedList = parentItem.nested!;
  const liftedItem = nestedList.children[itemIndex]!;
  const remainingItems = nestedList.children.filter((_, index) => index !== itemIndex);
  const updatedParent =
    remainingItems.length === 0
      ? removeNestedList(parentItem)
      : {
          ...parentItem,
          nested: { ...nestedList, children: remainingItems },
        };

  return {
    ...parentList,
    children: [
      ...parentList.children.slice(0, parentItemIndex),
      updatedParent,
      liftedItem,
      ...parentList.children.slice(parentItemIndex + 1),
    ],
  };
}

export function applyOutdentListItem(
  document: DocumentNode,
  operation: OutdentListItemOperation,
): DocumentNode {
  const target = getOutdentTarget(document, operation);

  return updateListAtPath(document, target.parentListPath, (list) =>
    outdentListItem(list, target.parentItemIndex, target.itemIndex),
  );
}

export function createSelectionAfterOutdentListItem(
  document: DocumentNode,
  operation: OutdentListItemOperation,
): RangeSelection {
  const target = getOutdentTarget(document, operation);
  const point = {
    offset: operation.point.offset,
    path: [...target.parentListPath, target.parentItemIndex + 1, target.textIndex],
  };

  return {
    anchor: point,
    focus: { offset: point.offset, path: [...point.path] },
  };
}
