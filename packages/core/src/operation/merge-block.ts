import { createText, type DocumentNode, type ParagraphNode } from "../model";
import type { Point } from "../selection";
import { isValidPoint } from "../selection";
import type { MergeBlockOperation } from "./types";

export function createMergeBlockOperation(point: Point): MergeBlockOperation {
  return {
    point: {
      path: [...point.path],
      offset: point.offset,
    },
    type: "merge_block",
  };
}

function getMergeBlockIndex(
  document: DocumentNode,
  operation: MergeBlockOperation,
): number {
  if (!isValidPoint(document, operation.point)) {
    throw new RangeError("merge block point must reference a text node");
  }

  const [blockIndex, textIndex] = operation.point.path;

  if (
    blockIndex === undefined ||
    textIndex !== 0 ||
    blockIndex === 0 ||
    operation.point.offset !== 0
  ) {
    throw new RangeError("merge block point must be at the start of a non-first block");
  }

  return blockIndex;
}

function isEmptyParagraphChildren(children: ParagraphNode["children"]): boolean {
  return children.length === 0 || (children.length === 1 && children[0]?.text === "");
}

function mergeParagraphChildren(
  previousChildren: ParagraphNode["children"],
  currentChildren: ParagraphNode["children"],
): ParagraphNode["children"] {
  const previousEmpty = isEmptyParagraphChildren(previousChildren);
  const currentEmpty = isEmptyParagraphChildren(currentChildren);

  if (previousEmpty && currentEmpty) {
    return [createText()];
  }

  if (previousEmpty) {
    return currentChildren;
  }

  if (currentEmpty) {
    return previousChildren;
  }

  return [...previousChildren, ...currentChildren];
}

export function applyMergeBlock(
  document: DocumentNode,
  operation: MergeBlockOperation,
): DocumentNode {
  const blockIndex = getMergeBlockIndex(document, operation);
  const previousBlockIndex = blockIndex - 1;
  const previousBlock = document.children[previousBlockIndex]!;
  const currentBlock = document.children[blockIndex]!;
  const mergedBlock = {
    ...previousBlock,
    children: mergeParagraphChildren(previousBlock.children, currentBlock.children),
  };

  return {
    ...document,
    children: [
      ...document.children.slice(0, previousBlockIndex),
      mergedBlock,
      ...document.children.slice(blockIndex + 1),
    ],
  };
}
