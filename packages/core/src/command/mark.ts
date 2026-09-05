import { hasTextMark, isTextBlockNode, type TextMarkType } from "../model";
import {
  createSelectionAfterToggleMark,
  createToggleMarkOperation,
  createTransaction,
} from "../operation";
import {
  isCollapsed,
  isValidPoint,
  normalizeRange,
  type RangeSelection,
} from "../selection";
import { createCommandSkipped, createCommandSuccess } from "./result";
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

interface TextCommandRange {
  blockIndex: number;
  endTextIndex: number;
  range: RangeSelection;
  startTextIndex: number;
}

function getTextCommandRange(input: CommandInput): TextCommandRange | undefined {
  const selection = input.context.selection;

  if (!selection) {
    return undefined;
  }

  const range = normalizeRange(selection);

  if (
    !isValidPoint(input.context.document, range.anchor) ||
    !isValidPoint(input.context.document, range.focus)
  ) {
    return undefined;
  }

  const [anchorBlockIndex, anchorTextIndex] = range.anchor.path;
  const [focusBlockIndex, focusTextIndex] = range.focus.path;

  if (
    range.anchor.path.length !== 2 ||
    range.focus.path.length !== 2 ||
    anchorBlockIndex === undefined ||
    anchorTextIndex === undefined ||
    focusBlockIndex === undefined ||
    focusTextIndex === undefined ||
    anchorBlockIndex !== focusBlockIndex
  ) {
    return undefined;
  }

  if (input.context.document.children[anchorBlockIndex]?.type === "codeBlock") {
    return undefined;
  }

  return {
    blockIndex: anchorBlockIndex,
    endTextIndex: focusTextIndex,
    range,
    startTextIndex: anchorTextIndex,
  };
}

export function canExecuteTextMarkCommand(input: CommandInput): boolean {
  return getTextCommandRange(input) !== undefined;
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
  const target = getTextCommandRange(input);

  if (!target) {
    return false;
  }

  const block = input.context.document.children[target.blockIndex];
  const textNodes = isTextBlockNode(block) ? block.children : undefined;

  if (!textNodes) {
    return false;
  }

  if (isCollapsed(target.range)) {
    return hasTextMark(textNodes[target.startTextIndex]?.marks, mark);
  }

  const selectedNodes = textNodes
    .slice(target.startTextIndex, target.endTextIndex + 1)
    .filter((node, index) => {
      const textIndex = target.startTextIndex + index;
      const selectionStart =
        textIndex === target.startTextIndex ? target.range.anchor.offset : 0;
      const selectionEnd =
        textIndex === target.endTextIndex
          ? target.range.focus.offset
          : node.text.length;

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
      if (!canExecuteTextMarkCommand(input) || !input.context.selection) {
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
