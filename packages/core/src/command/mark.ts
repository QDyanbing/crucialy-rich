import { hasTextMark, isTextNode } from "../model";
import {
  createSelectionAfterToggleMark,
  createToggleMarkOperation,
  createTransaction,
} from "../operation";
import { getNodeAtPath, isValidPoint, normalizeRange, type Path } from "../selection";
import { createCommandSkipped, createCommandSuccess } from "./result";
import type { Command, CommandInput } from "./types";

export const BOLD_COMMAND_NAME = "bold";

function isSamePath(left: Path, right: Path): boolean {
  return (
    left.length === right.length && left.every((part, index) => part === right[index])
  );
}

function canToggleMarkRange(input: CommandInput): boolean {
  const selection = input.context.selection;

  if (!selection) {
    return false;
  }

  const range = normalizeRange(selection);

  return (
    isValidPoint(input.context.document, range.anchor) &&
    isValidPoint(input.context.document, range.focus) &&
    isSamePath(range.anchor.path, range.focus.path)
  );
}

export function canExecuteBoldCommand(input: CommandInput): boolean {
  return canToggleMarkRange(input);
}

export function isBoldCommandActive(input: CommandInput): boolean {
  const selection = input.context.selection;

  if (!selection) {
    return false;
  }

  const range = normalizeRange(selection);
  const node = getNodeAtPath(input.context.document, range.anchor.path);

  return isTextNode(node) && hasTextMark(node.marks, "bold");
}

export const boldCommand: Command = {
  canExecute: canExecuteBoldCommand,
  execute(input) {
    if (!canToggleMarkRange(input) || !input.context.selection) {
      return createCommandSkipped(
        BOLD_COMMAND_NAME,
        "Bold command requires a text selection.",
      );
    }

    const operation = createToggleMarkOperation(
      normalizeRange(input.context.selection),
      "bold",
    );

    return createCommandSuccess(BOLD_COMMAND_NAME, {
      selection: createSelectionAfterToggleMark(input.context.document, operation),
      transaction: createTransaction([operation]),
    });
  },
  isActive: isBoldCommandActive,
  name: BOLD_COMMAND_NAME,
};
