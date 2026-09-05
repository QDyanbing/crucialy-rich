import {
  createParagraph,
  isListNode,
  type DocumentNode,
  type ListNode,
} from "../model";
import { isValidPoint, type Point, type RangeSelection } from "../selection";
import type { ExitListItemOperation } from "./types";

export function createExitListItemOperation(point: Point): ExitListItemOperation {
  return {
    point: { offset: point.offset, path: [...point.path] },
    type: "exit_list_item",
  };
}

function getTarget(document: DocumentNode, operation: ExitListItemOperation) {
  const [blockIndex, itemIndex, textIndex] = operation.point.path;
  const list = blockIndex === undefined ? undefined : document.children[blockIndex];
  const item =
    isListNode(list) && itemIndex !== undefined ? list.children[itemIndex] : undefined;

  if (
    operation.point.path.length !== 3 ||
    !isValidPoint(document, operation.point) ||
    blockIndex === undefined ||
    itemIndex === undefined ||
    textIndex === undefined ||
    textIndex !== 0 ||
    operation.point.offset !== 0 ||
    !isListNode(list) ||
    !item ||
    item.children.some((text) => text.text.length > 0)
  ) {
    throw new RangeError("exit list item requires an empty list item selection");
  }

  return { blockIndex, itemIndex, list };
}

function createListSegment(list: ListNode, start: number, end?: number): ListNode {
  return { children: list.children.slice(start, end), type: list.type };
}

export function applyExitListItem(
  document: DocumentNode,
  operation: ExitListItemOperation,
): DocumentNode {
  const { blockIndex, itemIndex, list } = getTarget(document, operation);
  const before = createListSegment(list, 0, itemIndex);
  const after = createListSegment(list, itemIndex + 1);
  const replacement = [
    ...(before.children.length > 0 ? [before] : []),
    createParagraph(),
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

export function createSelectionAfterExitListItem(
  document: DocumentNode,
  operation: ExitListItemOperation,
): RangeSelection {
  const { blockIndex, itemIndex } = getTarget(document, operation);
  const paragraphIndex = blockIndex + (itemIndex > 0 ? 1 : 0);
  const point = { offset: 0, path: [paragraphIndex, 0] };

  return {
    anchor: point,
    focus: { offset: point.offset, path: [...point.path] },
  };
}
