import { isValidPoint } from "../selection";
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
