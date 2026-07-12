import type { DocumentNode } from "../model";
import {
  createMergeBlockOperation,
  createSelectionAfterMergeBlock,
  createSelectionAfterSplitBlock,
  createSplitBlockOperation,
  createTransaction,
} from "../operation";
import { isValidPoint, type Point } from "../selection";
import { createCommandSkipped, createCommandSuccess } from "./result";
import type { Command, CommandInput } from "./types";

export const SPLIT_BLOCK_COMMAND_NAME = "splitBlock";
export const MERGE_BLOCK_COMMAND_NAME = "mergeBlock";

function getSelectionAnchor(input: CommandInput): Point | undefined {
  return input.context.selection?.anchor;
}

function canSplitBlockAt(document: DocumentNode, point: Point | undefined): boolean {
  return point ? isValidPoint(document, point) : false;
}

function canMergeBlockAt(document: DocumentNode, point: Point | undefined): boolean {
  if (!point || !isValidPoint(document, point)) {
    return false;
  }

  const [blockIndex, textIndex] = point.path;

  return (
    blockIndex !== undefined && blockIndex > 0 && textIndex === 0 && point.offset === 0
  );
}

export function canExecuteSplitBlockCommand(input: CommandInput): boolean {
  return canSplitBlockAt(input.context.document, getSelectionAnchor(input));
}

export const splitBlockCommand: Command = {
  canExecute: canExecuteSplitBlockCommand,
  execute(input) {
    const point = getSelectionAnchor(input);

    if (!canSplitBlockAt(input.context.document, point)) {
      return createCommandSkipped(
        SPLIT_BLOCK_COMMAND_NAME,
        "Split block command requires a valid text selection.",
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
  return canMergeBlockAt(input.context.document, getSelectionAnchor(input));
}

export const mergeBlockCommand: Command = {
  canExecute: canExecuteMergeBlockCommand,
  execute(input) {
    const point = getSelectionAnchor(input);

    if (!canMergeBlockAt(input.context.document, point)) {
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
