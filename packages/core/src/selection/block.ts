import { isBlockNode, isImageNode, type DocumentNode } from "../model";
import { getNodeAtPath } from "./path";
import type { BlockSelection, Path } from "./types";

export function createBlockSelection(path: Path): BlockSelection {
  return { path: [...path], type: "block" };
}

export function cloneBlockSelection(selection: BlockSelection): BlockSelection {
  return createBlockSelection(selection.path);
}

export function isValidBlockSelection(
  document: DocumentNode,
  selection: BlockSelection,
): boolean {
  return (
    selection.path.length === 1 && isBlockNode(getNodeAtPath(document, selection.path))
  );
}

export function isImageBlockSelection(
  document: DocumentNode,
  selection: BlockSelection,
): boolean {
  return (
    isValidBlockSelection(document, selection) &&
    isImageNode(getNodeAtPath(document, selection.path))
  );
}
