import {
  createMergeBlockOperation,
  createSelectionAfterMergeBlock,
  createSelectionAfterSplitBlock,
  createSplitBlockOperation,
  createTransaction,
} from "../operation";
import { isCollapsed, isValidPoint, type Point } from "../selection";
import { createCommandSkipped, createCommandSuccess } from "./result";
import type { Command, CommandInput } from "./types";

export const SPLIT_BLOCK_COMMAND_NAME = "splitBlock";
export const MERGE_BLOCK_COMMAND_NAME = "mergeBlock";

function getSelectionAnchor(input: CommandInput): Point | undefined {
  return input.context.selection?.anchor;
}

function hasCollapsedSelection(input: CommandInput): boolean {
  return input.context.selection ? isCollapsed(input.context.selection) : false;
}

function canSplitBlockAt(input: CommandInput, point: Point | undefined): boolean {
  return (
    hasCollapsedSelection(input) &&
    point !== undefined &&
    isValidPoint(input.context.document, point)
  );
}

function canMergeBlockAt(input: CommandInput, point: Point | undefined): boolean {
  if (
    !hasCollapsedSelection(input) ||
    !point ||
    !isValidPoint(input.context.document, point)
  ) {
    return false;
  }

  const [blockIndex, textIndex] = point.path;

  return (
    blockIndex !== undefined && blockIndex > 0 && textIndex === 0 && point.offset === 0
  );
}

export function canExecuteSplitBlockCommand(input: CommandInput): boolean {
  return canSplitBlockAt(input, getSelectionAnchor(input));
}

export const splitBlockCommand: Command = {
  canExecute: canExecuteSplitBlockCommand,
  execute(input) {
    const point = getSelectionAnchor(input);

    if (!point || !canSplitBlockAt(input, point)) {
      return createCommandSkipped(
        SPLIT_BLOCK_COMMAND_NAME,
        "Split block command requires a collapsed text selection.",
      );
    }

    const operation = createSplitBlockOperation(point);

    return createCommandSuccess(SPLIT_BLOCK_COMMAND_NAME, {
      selection: createSelectionAfterSplitBlock(operation),
      transaction: createTransaction([operation]),
    });
  },
  name: SPLIT_BLOCK_COMMAND_NAME,
};

export function canExecuteMergeBlockCommand(input: CommandInput): boolean {
  return canMergeBlockAt(input, getSelectionAnchor(input));
}

export const mergeBlockCommand: Command = {
  canExecute: canExecuteMergeBlockCommand,
  execute(input) {
    const point = getSelectionAnchor(input);

    if (!point || !canMergeBlockAt(input, point)) {
      return createCommandSkipped(
        MERGE_BLOCK_COMMAND_NAME,
        "Merge block command requires the start of a non-first block.",
      );
    }

    const operation = createMergeBlockOperation(point);

    return createCommandSuccess(MERGE_BLOCK_COMMAND_NAME, {
      selection: createSelectionAfterMergeBlock(input.context.document, operation),
      transaction: createTransaction([operation]),
    });
  },
  name: MERGE_BLOCK_COMMAND_NAME,
};
