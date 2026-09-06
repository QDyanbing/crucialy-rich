import { createParagraph, type DocumentNode, type ListNode } from "../model";
import type { Point, RangeSelection } from "../selection";
import { getListItemTarget } from "./list-item-path";
import type { UnwrapListItemOperation } from "./types";

export function createUnwrapListItemOperation(point: Point): UnwrapListItemOperation {
  return {
    point: { offset: point.offset, path: [...point.path] },
    type: "unwrap_list_item",
  };
}

function getUnwrapTarget(document: DocumentNode, operation: UnwrapListItemOperation) {
  const target = getListItemTarget(document, operation.point);

  if (!target || target.listPath.length !== 1 || target.textIndex !== 0) {
    throw new RangeError("unwrap list item requires a top-level list item start");
  }

  return target;
}

function createListSegment(list: ListNode, start: number, end?: number): ListNode {
  return { children: list.children.slice(start, end), type: list.type };
}

export function applyUnwrapListItem(
  document: DocumentNode,
  operation: UnwrapListItemOperation,
): DocumentNode {
  const { blockIndex, item, itemIndex, list } = getUnwrapTarget(document, operation);
  const before = createListSegment(list, 0, itemIndex);
  const after = createListSegment(list, itemIndex + 1);
  const replacement = [
    ...(before.children.length > 0 ? [before] : []),
    createParagraph(item.children),
    ...(item.nested ? [item.nested] : []),
    ...(after.children.length > 0 ? [after] : []),
  ];

  return {
    ...document,
    children: [
      ...document.children.slice(0, blockIndex),
      ...replacement,
      ...document.children.slice(blockIndex + 1),
    ],
  };
}

export function createSelectionAfterUnwrapListItem(
  document: DocumentNode,
  operation: UnwrapListItemOperation,
): RangeSelection {
  const { blockIndex, itemIndex } = getUnwrapTarget(document, operation);
  const point = {
    offset: operation.point.offset,
    path: [blockIndex + (itemIndex > 0 ? 1 : 0), 0],
  };

  return {
    anchor: point,
    focus: { offset: point.offset, path: [...point.path] },
  };
}
