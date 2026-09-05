import { createListItem, isListNode, type DocumentNode } from "../model";
import { isValidPoint, type Point, type RangeSelection } from "../selection";
import type { SplitListItemOperation } from "./types";

export function createSplitListItemOperation(point: Point): SplitListItemOperation {
  return {
    point: { offset: point.offset, path: [...point.path] },
    type: "split_list_item",
  };
}

function getTarget(document: DocumentNode, operation: SplitListItemOperation) {
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
    !isListNode(list) ||
    !item
  ) {
    throw new RangeError("split list item point must reference list item text");
  }

  return { blockIndex, item, itemIndex, list, textIndex };
}

export function applySplitListItem(
  document: DocumentNode,
  operation: SplitListItemOperation,
): DocumentNode {
  const { blockIndex, item, itemIndex, list, textIndex } = getTarget(
    document,
    operation,
  );
  const text = item.children[textIndex]!;
  const left = { ...text, text: text.text.slice(0, operation.point.offset) };
  const right = { ...text, text: text.text.slice(operation.point.offset) };
  const leftItem = createListItem([...item.children.slice(0, textIndex), left]);
  const rightItem = createListItem([right, ...item.children.slice(textIndex + 1)]);

  return {
    ...document,
    children: document.children.map((block, index) =>
      index === blockIndex
        ? {
            ...list,
            children: [
              ...list.children.slice(0, itemIndex),
              leftItem,
              rightItem,
              ...list.children.slice(itemIndex + 1),
            ],
          }
        : block,
    ),
  };
}

export function createSelectionAfterSplitListItem(
  operation: SplitListItemOperation,
): RangeSelection {
  const [blockIndex = 0, itemIndex = 0] = operation.point.path;
  const point = { offset: 0, path: [blockIndex, itemIndex + 1, 0] };

  return {
    anchor: point,
    focus: { offset: point.offset, path: [...point.path] },
  };
}
