import { createText, type DocumentNode, type ParagraphNode } from "../model";
import type { Point } from "../selection";
import { isValidPoint } from "../selection";
import type { SplitBlockOperation } from "./types";

export function createSplitBlockOperation(point: Point): SplitBlockOperation {
  return {
    point: {
      path: [...point.path],
      offset: point.offset,
    },
    type: "split_block",
  };
}

function getSplitBlockIndexes(
  document: DocumentNode,
  operation: SplitBlockOperation,
): [number, number] {
  if (!isValidPoint(document, operation.point)) {
    throw new RangeError("split block point must reference a text node");
  }

  const [blockIndex, textIndex] = operation.point.path;

  if (blockIndex === undefined || textIndex === undefined) {
    throw new RangeError("split block point must reference a text node");
  }

  return [blockIndex, textIndex];
}

function ensureTextChildren(children: ParagraphNode["children"]) {
  return children.length > 0 ? children : [createText()];
}

export function applySplitBlock(
  document: DocumentNode,
  operation: SplitBlockOperation,
): DocumentNode {
  const [blockIndex, textIndex] = getSplitBlockIndexes(document, operation);
  const block = document.children[blockIndex]!;
  const textNode = block.children[textIndex]!;
  const leftText = {
    ...textNode,
    text: textNode.text.slice(0, operation.point.offset),
  };
  const rightText = {
    ...textNode,
    text: textNode.text.slice(operation.point.offset),
  };
  const leftBlock = {
    ...block,
    children: ensureTextChildren([...block.children.slice(0, textIndex), leftText]),
  };
  const rightBlock = {
    ...block,
    children: ensureTextChildren([rightText, ...block.children.slice(textIndex + 1)]),
  };

  return {
    ...document,
    children: [
      ...document.children.slice(0, blockIndex),
      leftBlock,
      rightBlock,
      ...document.children.slice(blockIndex + 1),
    ],
  };
}
