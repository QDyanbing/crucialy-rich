import { isHeadingLevel, type HeadingLevel } from "../model";
import { createSetBlockTypeOperation, createTransaction } from "../operation";
import { cloneRangeSelection, isValidPoint } from "../selection";
import { createCommandSkipped, createCommandSuccess } from "./result";
import type { Command, CommandInput } from "./types";

export const SET_HEADING_COMMAND_NAME = "setHeading";

export interface SetHeadingCommandPayload {
  level: HeadingLevel | null;
}

function getHeadingLevel(input: CommandInput): HeadingLevel | null | undefined {
  if (
    typeof input.payload !== "object" ||
    input.payload === null ||
    !("level" in input.payload)
  ) {
    return undefined;
  }

  const level = input.payload.level;

  return level === null || isHeadingLevel(level) ? level : undefined;
}

function getSelectedBlockIndex(input: CommandInput): number | undefined {
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

  return anchorBlockIndex === focusBlockIndex ? anchorBlockIndex : undefined;
}

export function getSelectedHeadingLevel(
  input: CommandInput,
): HeadingLevel | null | undefined {
  const blockIndex = getSelectedBlockIndex(input);

  if (blockIndex === undefined) {
    return undefined;
  }

  const block = input.context.document.children[blockIndex];

  return block?.type === "heading" ? block.level : null;
}

export function canExecuteSetHeadingCommand(input: CommandInput): boolean {
  return (
    getHeadingLevel(input) !== undefined && getSelectedBlockIndex(input) !== undefined
  );
}

export function isHeadingCommandActive(input: CommandInput): boolean {
  const level = getHeadingLevel(input);
  const blockIndex = getSelectedBlockIndex(input);

  if (level === undefined || blockIndex === undefined) {
    return false;
  }

  const block = input.context.document.children[blockIndex];

  return level === null
    ? block?.type === "paragraph"
    : block?.type === "heading" && block.level === level;
}

export const setHeadingCommand: Command = {
  canExecute: canExecuteSetHeadingCommand,
  execute(input) {
    const level = getHeadingLevel(input);
    const blockIndex = getSelectedBlockIndex(input);
    const selection = input.context.selection;

    if (level === undefined || blockIndex === undefined || !selection) {
      return createCommandSkipped(
        SET_HEADING_COMMAND_NAME,
        "Set heading command requires a valid level and single-block text selection.",
      );
    }

    const operation = createSetBlockTypeOperation(
      [blockIndex],
      level === null ? { type: "paragraph" } : { level, type: "heading" },
    );

    return createCommandSuccess(SET_HEADING_COMMAND_NAME, {
      selection: cloneRangeSelection(selection),
      transaction: createTransaction([operation]),
    });
  },
  isActive: isHeadingCommandActive,
  name: SET_HEADING_COMMAND_NAME,
};
