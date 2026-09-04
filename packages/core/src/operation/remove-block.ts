import type { DocumentNode } from "../model";
import type { Path } from "../selection";
import type { RemoveBlockOperation } from "./types";

export function createRemoveBlockOperation(path: Path): RemoveBlockOperation {
  return { path: [...path], type: "remove_block" };
}

function getRemoveIndex(
  document: DocumentNode,
  operation: RemoveBlockOperation,
): number {
  const [blockIndex, ...rest] = operation.path;

  if (
    rest.length > 0 ||
    blockIndex === undefined ||
    !Number.isInteger(blockIndex) ||
    blockIndex < 0 ||
    blockIndex >= document.children.length
  ) {
    throw new RangeError("remove block path must reference a block");
  }

  return blockIndex;
}

export function applyRemoveBlock(
  document: DocumentNode,
  operation: RemoveBlockOperation,
): DocumentNode {
  const blockIndex = getRemoveIndex(document, operation);

  return {
    ...document,
    children: document.children.filter((_, index) => index !== blockIndex),
  };
}
