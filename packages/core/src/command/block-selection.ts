import { isValidPoint } from "../selection";
import type { BlockNode } from "../model";
import type { CommandInput } from "./types";

export function getSelectedBlockIndexes(input: CommandInput): number[] | undefined {
  const selection = input.context.selection;

  if (
    !selection ||
    !isValidPoint(input.context.document, selection.anchor) ||
    !isValidPoint(input.context.document, selection.focus)
  ) {
    return undefined;
  }

  const anchorBlockIndex = selection.anchor.path[0];
  const focusBlockIndex = selection.focus.path[0];

  if (anchorBlockIndex === undefined || focusBlockIndex === undefined) {
    return undefined;
  }

  const startBlockIndex = Math.min(anchorBlockIndex, focusBlockIndex);
  const endBlockIndex = Math.max(anchorBlockIndex, focusBlockIndex);

  return Array.from(
    { length: endBlockIndex - startBlockIndex + 1 },
    (_, index) => startBlockIndex + index,
  );
}

export function doSelectedBlocksMatch(
  input: CommandInput,
  predicate: (block: BlockNode, blockIndex: number) => boolean,
): boolean {
  const blockIndexes = getSelectedBlockIndexes(input);

  return (
    blockIndexes !== undefined &&
    blockIndexes.every((blockIndex) => {
      const block = input.context.document.children[blockIndex];

      return block !== undefined && predicate(block, blockIndex);
    })
  );
}
