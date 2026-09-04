import { doSelectedBlocksMatch, getSelectedBlockIndexes } from "./block-selection";
import { createSelectedBlockTypeCommandSuccess } from "./block-type-result";
import { createCommandSkipped } from "./result";
import type { Command, CommandInput } from "./types";

export const SET_CODE_BLOCK_COMMAND_NAME = "setCodeBlock";

export interface SetCodeBlockCommandPayload {
  enabled?: boolean;
}

function resolveEnabled(input: CommandInput): boolean | undefined {
  if (input.payload === undefined) {
    return true;
  }

  if (
    typeof input.payload !== "object" ||
    input.payload === null ||
    !("enabled" in input.payload) ||
    typeof input.payload.enabled !== "boolean"
  ) {
    return undefined;
  }

  return input.payload.enabled;
}

export function canExecuteSetCodeBlockCommand(input: CommandInput): boolean {
  return (
    resolveEnabled(input) !== undefined && getSelectedBlockIndexes(input) !== undefined
  );
}

export function isCodeBlockCommandActive(input: CommandInput): boolean {
  return doSelectedBlocksMatch(input, (block) => block.type === "codeBlock");
}

export const setCodeBlockCommand: Command = {
  canExecute: canExecuteSetCodeBlockCommand,
  execute(input) {
    const enabled = resolveEnabled(input);
    const result =
      enabled === undefined
        ? undefined
        : createSelectedBlockTypeCommandSuccess(
            SET_CODE_BLOCK_COMMAND_NAME,
            input,
            enabled ? { type: "codeBlock" } : { type: "paragraph" },
          );

    return (
      result ??
      createCommandSkipped(
        SET_CODE_BLOCK_COMMAND_NAME,
        "Set code block command requires a valid text selection and payload.",
      )
    );
  },
  isActive: isCodeBlockCommandActive,
  name: SET_CODE_BLOCK_COMMAND_NAME,
};
