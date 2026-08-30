import { isHeadingLevel, type HeadingLevel } from "../model";
import { doSelectedBlocksMatch, getSelectedBlockIndexes } from "./block-selection";
import { createSelectedBlockTypeCommandSuccess } from "./block-type-result";
import { createCommandSkipped } from "./result";
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

export function getSelectedHeadingLevel(
  input: CommandInput,
): HeadingLevel | null | undefined {
  const blockIndexes = getSelectedBlockIndexes(input);

  if (!blockIndexes) {
    return undefined;
  }

  const blocks = blockIndexes.map(
    (blockIndex) => input.context.document.children[blockIndex]!,
  );
  const firstBlock = blocks[0];

  return firstBlock?.type === "heading" &&
    blocks.every(
      (block) => block.type === "heading" && block.level === firstBlock.level,
    )
    ? firstBlock.level
    : null;
}

export function canExecuteSetHeadingCommand(input: CommandInput): boolean {
  return (
    getHeadingLevel(input) !== undefined && getSelectedBlockIndexes(input) !== undefined
  );
}

export function isHeadingCommandActive(input: CommandInput): boolean {
  const level = getHeadingLevel(input);

  if (level === undefined) {
    return false;
  }

  return doSelectedBlocksMatch(input, (block) => {
    return level === null
      ? block.type === "paragraph"
      : block.type === "heading" && block.level === level;
  });
}

export const setHeadingCommand: Command = {
  canExecute: canExecuteSetHeadingCommand,
  execute(input) {
    const level = getHeadingLevel(input);

    if (level !== undefined) {
      const result = createSelectedBlockTypeCommandSuccess(
        SET_HEADING_COMMAND_NAME,
        input,
        level === null ? { type: "paragraph" } : { level, type: "heading" },
      );

      if (result) {
        return result;
      }
    }

    return createCommandSkipped(
      SET_HEADING_COMMAND_NAME,
      "Set heading command requires a valid level and text selection.",
    );
  },
  isActive: isHeadingCommandActive,
  name: SET_HEADING_COMMAND_NAME,
};
