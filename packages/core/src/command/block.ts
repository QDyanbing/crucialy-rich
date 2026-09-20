import {
  applyOperation,
  createMergeBlockOperation,
  createSelectionAfterMergeBlock,
  createTransaction,
} from "../operation";
import { isParagraphNode, isTextBlockNode } from "../model";
import { createEnterInputTransaction, createSelectionAfterEnterInput } from "../input";
import { getNodeAtPath, isCollapsed, isValidPoint, type Point } from "../selection";
import { createCommandSkipped, createCommandSuccess } from "./result";
import { createRangeDeletionPlan } from "./range-deletion";
import type { Command, CommandInput } from "./types";

export const SPLIT_BLOCK_COMMAND_NAME = "splitBlock";
export const MERGE_BLOCK_COMMAND_NAME = "mergeBlock";

function getSelectionAnchor(input: CommandInput): Point | undefined {
  return input.context.selection?.anchor;
}

function hasCollapsedSelection(input: CommandInput): boolean {
  return input.context.selection ? isCollapsed(input.context.selection) : false;
}

function canSplitCollapsedBlockAt(
  input: CommandInput,
  point: Point | undefined,
): boolean {
  return (
    hasCollapsedSelection(input) &&
    point !== undefined &&
    isValidPoint(input.context.document, point)
  );
}

function canSplitBlockSelection(input: CommandInput): boolean {
  const selection = input.context.selection;

  if (!selection) {
    return false;
  }

  if (isCollapsed(selection)) {
    return canSplitCollapsedBlockAt(input, selection.anchor);
  }

  return (
    createRangeDeletionPlan(input.context.document, selection)?.operation.type ===
    "delete_text"
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

  if (point.path.length === 5) {
    const [blockIndex, rowIndex, cellIndex, paragraphIndex, textIndex] = point.path;
    const previousParagraph =
      blockIndex === undefined ||
      rowIndex === undefined ||
      cellIndex === undefined ||
      paragraphIndex === undefined
        ? undefined
        : getNodeAtPath(input.context.document, [
            blockIndex,
            rowIndex,
            cellIndex,
            paragraphIndex - 1,
          ]);

    return (
      paragraphIndex !== undefined &&
      paragraphIndex > 0 &&
      textIndex === 0 &&
      point.offset === 0 &&
      isParagraphNode(previousParagraph)
    );
  }

  if (point.path.length !== 2) {
    return false;
  }

  const [blockIndex, textIndex] = point.path;
  const previousBlock =
    blockIndex === undefined
      ? undefined
      : input.context.document.children[blockIndex - 1];

  return (
    blockIndex !== undefined &&
    blockIndex > 0 &&
    textIndex === 0 &&
    point.offset === 0 &&
    isTextBlockNode(previousBlock)
  );
}

export function canExecuteSplitBlockCommand(input: CommandInput): boolean {
  return canSplitBlockSelection(input);
}

export const splitBlockCommand: Command = {
  canExecute: canExecuteSplitBlockCommand,
  execute(input) {
    const selection = input.context.selection;

    if (!selection || !canSplitBlockSelection(input)) {
      return createCommandSkipped(
        SPLIT_BLOCK_COMMAND_NAME,
        "Split block command requires an editable text selection.",
      );
    }

    const deletion = isCollapsed(selection)
      ? undefined
      : createRangeDeletionPlan(input.context.document, selection);
    const document = deletion
      ? applyOperation(input.context.document, deletion.operation)
      : input.context.document;
    const nextSelection = deletion?.selection ?? selection;

    const enterInput = {
      document,
      selection: nextSelection,
    };
    const enterTransaction = createEnterInputTransaction(enterInput);

    return createCommandSuccess(SPLIT_BLOCK_COMMAND_NAME, {
      selection: createSelectionAfterEnterInput(enterInput),
      transaction: createTransaction([
        ...(deletion ? [deletion.operation] : []),
        ...enterTransaction.operations,
      ]),
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
