import { hasTextMark, isTextBlockNode, type TextMarkType } from "../model";
import {
  applyTransaction,
  createSelectionAfterToggleMark,
  createToggleMarkOperation,
  createTransaction,
} from "../operation";
import { isCollapsed } from "../selection";
import { createCommandSkipped, createCommandSuccess } from "./result";
import {
  getTextMarkCommandRanges,
  restoreTextMarkCommandSelection,
  type TextMarkCommandRange,
} from "./text-mark-range";
import type { Command, CommandInput } from "./types";

export const BOLD_COMMAND_NAME = "bold";
export const ITALIC_COMMAND_NAME = "italic";
export const STRIKE_COMMAND_NAME = "strike";
export const UNDERLINE_COMMAND_NAME = "underline";

export interface TextMarkCommandConfig {
  commandName: string;
  label: string;
  mark: TextMarkType;
}

function getTextCommandRanges(input: CommandInput) {
  const selection = input.context.selection;

  return selection
    ? getTextMarkCommandRanges(input.context.document, selection)
    : undefined;
}

export function canExecuteTextMarkCommand(input: CommandInput): boolean {
  return getTextCommandRanges(input) !== undefined;
}

export function canExecuteBoldCommand(input: CommandInput): boolean {
  return canExecuteTextMarkCommand(input);
}

export function canExecuteItalicCommand(input: CommandInput): boolean {
  return canExecuteTextMarkCommand(input);
}

export function canExecuteStrikeCommand(input: CommandInput): boolean {
  return canExecuteTextMarkCommand(input);
}

export function canExecuteUnderlineCommand(input: CommandInput): boolean {
  return canExecuteTextMarkCommand(input);
}

export function isTextMarkCommandActive(
  input: CommandInput,
  mark: TextMarkType,
): boolean {
  const targets = getTextCommandRanges(input);

  return (
    targets !== undefined &&
    targets.every((target) => isTextMarkRangeActive(input, target, mark))
  );
}

function isTextMarkRangeActive(
  input: CommandInput,
  target: TextMarkCommandRange,
  mark: TextMarkType,
): boolean {
  const block = input.context.document.children[target.blockIndex];

  if (!isTextBlockNode(block)) {
    return false;
  }

  const startTextIndex = target.range.anchor.path[1];
  const endTextIndex = target.range.focus.path[1];

  if (startTextIndex === undefined || endTextIndex === undefined) {
    return false;
  }

  if (isCollapsed(target.range)) {
    return hasTextMark(block.children[startTextIndex]?.marks, mark);
  }

  const selectedNodes = block.children
    .slice(startTextIndex, endTextIndex + 1)
    .filter((node, index) => {
      const textIndex = startTextIndex + index;
      const selectionStart =
        textIndex === startTextIndex ? target.range.anchor.offset : 0;
      const selectionEnd =
        textIndex === endTextIndex ? target.range.focus.offset : node.text.length;

      return selectionStart < selectionEnd;
    });

  return (
    selectedNodes.length > 0 &&
    selectedNodes.every((node) => hasTextMark(node.marks, mark))
  );
}

export function isBoldCommandActive(input: CommandInput): boolean {
  return isTextMarkCommandActive(input, "bold");
}

export function isItalicCommandActive(input: CommandInput): boolean {
  return isTextMarkCommandActive(input, "italic");
}

export function isStrikeCommandActive(input: CommandInput): boolean {
  return isTextMarkCommandActive(input, "strike");
}

export function isUnderlineCommandActive(input: CommandInput): boolean {
  return isTextMarkCommandActive(input, "underline");
}

export function createTextMarkCommand(config: TextMarkCommandConfig): Command {
  return {
    canExecute: canExecuteTextMarkCommand,
    execute(input) {
      const selection = input.context.selection;
      const ranges = getTextCommandRanges(input);

      if (!selection || !ranges) {
        return createCommandSkipped(
          config.commandName,
          `${config.label} command requires a text selection.`,
        );
      }

      const active =
        ranges.length > 1 ? !isTextMarkCommandActive(input, config.mark) : undefined;
      const operations = ranges.map(({ range }) =>
        createToggleMarkOperation(range, config.mark, active),
      );
      const transaction = createTransaction(operations);
      const nextSelection =
        ranges.length === 1
          ? createSelectionAfterToggleMark(input.context.document, operations[0]!)
          : restoreTextMarkCommandSelection(
              input.context.document,
              selection,
              applyTransaction(input.context.document, transaction),
            );

      if (!nextSelection) {
        return createCommandSkipped(
          config.commandName,
          `${config.label} command could not restore the text selection.`,
        );
      }

      return createCommandSuccess(config.commandName, {
        selection: nextSelection,
        transaction,
      });
    },
    isActive: (input) => isTextMarkCommandActive(input, config.mark),
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

export const strikeCommand: Command = createTextMarkCommand({
  commandName: STRIKE_COMMAND_NAME,
  label: "Strike",
  mark: "strike",
});

export const underlineCommand: Command = createTextMarkCommand({
  commandName: UNDERLINE_COMMAND_NAME,
  label: "Underline",
  mark: "underline",
});

export const BOOLEAN_MARK_COMMANDS: readonly Command[] = [
  boldCommand,
  italicCommand,
  underlineCommand,
  strikeCommand,
];
