import { MAX_LIST_DEPTH, type DocumentNode, type ListNode } from "../model";
import type { Point, RangeSelection } from "../selection";
import { getListItemTarget, updateListAtPath } from "./list-item-path";
import type { IndentListItemOperation } from "./types";

export function createIndentListItemOperation(point: Point): IndentListItemOperation {
  return {
    point: { offset: point.offset, path: [...point.path] },
    type: "indent_list_item",
  };
}

function getIndentTarget(document: DocumentNode, operation: IndentListItemOperation) {
  const target = getListItemTarget(document, operation.point);
  const depth = target ? (target.listPath.length + 1) / 2 : 0;

  if (!target || target.itemIndex === 0 || depth >= MAX_LIST_DEPTH) {
    throw new RangeError(
      "indent list item requires a non-first item below the maximum depth",
    );
  }

  const previousItem = target.list.children[target.itemIndex - 1]!;
  const nestedItemIndex = previousItem.nested?.children.length ?? 0;

  return { ...target, nestedItemIndex, previousItem };
}

function indentListItem(list: ListNode, itemIndex: number): ListNode {
  const item = list.children[itemIndex]!;
  const previousItem = list.children[itemIndex - 1]!;
  const nested = previousItem.nested
    ? {
        ...previousItem.nested,
        children: [...previousItem.nested.children, item],
      }
    : { children: [item], type: list.type };

  return {
    ...list,
    children: [
      ...list.children.slice(0, itemIndex - 1),
      { ...previousItem, nested },
      ...list.children.slice(itemIndex + 1),
    ],
  };
}

export function applyIndentListItem(
  document: DocumentNode,
  operation: IndentListItemOperation,
): DocumentNode {
  const target = getIndentTarget(document, operation);

  return updateListAtPath(document, target.listPath, (list) =>
    indentListItem(list, target.itemIndex),
  );
}

export function createSelectionAfterIndentListItem(
  document: DocumentNode,
  operation: IndentListItemOperation,
): RangeSelection {
  const target = getIndentTarget(document, operation);
  const point = {
    offset: operation.point.offset,
    path: [
      ...target.listPath,
      target.itemIndex - 1,
      target.previousItem.children.length,
      target.nestedItemIndex,
      target.textIndex,
    ],
  };

  return {
    anchor: point,
    focus: { offset: point.offset, path: [...point.path] },
  };
}
