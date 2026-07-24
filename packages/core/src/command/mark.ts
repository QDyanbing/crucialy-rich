import { hasTextMark, isTextNode, type TextMarkType } from "../model";
import {
  createSelectionAfterToggleMark,
  createToggleMarkOperation,
  createTransaction,
} from "../operation";
import { getNodeAtPath, isValidPoint, normalizeRange, type Path } from "../selection";
import { createCommandSkipped, createCommandSuccess } from "./result";
import type { Command, CommandInput } from "./types";

export const BOLD_COMMAND_NAME = "bold";
export const ITALIC_COMMAND_NAME = "italic";

interface TextMarkCommandConfig {
  commandName: string;
  label: string;
  mark: TextMarkType;
}

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

export function canExecuteItalicCommand(input: CommandInput): boolean {
  return canToggleMarkRange(input);
}

function isTextMarkActive(input: CommandInput, mark: TextMarkType): boolean {
  const selection = input.context.selection;

  if (!selection) {
    return false;
  }

  const range = normalizeRange(selection);
  const node = getNodeAtPath(input.context.document, range.anchor.path);

  return isTextNode(node) && hasTextMark(node.marks, mark);
}

export function isBoldCommandActive(input: CommandInput): boolean {
  return isTextMarkActive(input, "bold");
}

export function isItalicCommandActive(input: CommandInput): boolean {
  return isTextMarkActive(input, "italic");
}

function createTextMarkCommand(config: TextMarkCommandConfig): Command {
  return {
    canExecute: canToggleMarkRange,
    execute(input) {
      if (!canToggleMarkRange(input) || !input.context.selection) {
        return createCommandSkipped(
          config.commandName,
          `${config.label} command requires a text selection.`,
        );
      }

      const operation = createToggleMarkOperation(
        normalizeRange(input.context.selection),
        config.mark,
      );

      return createCommandSuccess(config.commandName, {
        selection: createSelectionAfterToggleMark(input.context.document, operation),
        transaction: createTransaction([operation]),
      });
    },
    isActive: (input) => isTextMarkActive(input, config.mark),
    name: config.commandName,
  };
}

export const boldCommand: Command = createTextMarkCommand({
  commandName: BOLD_COMMAND_NAME,
  label: "Bold",
  mark: "bold",
});

export const italicCommand: Command = createTextMarkCommand({
  commandName: ITALIC_COMMAND_NAME,
  label: "Italic",
  mark: "italic",
});
