import { createDivider } from "../model";
import {
  createInsertBlockOperation,
  createSplitBlockOperation,
  createTransaction,
} from "../operation";
import { isCollapsed, isValidPoint, type Point } from "../selection";
import { createCommandSkipped, createCommandSuccess } from "./result";
import type { Command, CommandInput } from "./types";

export const INSERT_DIVIDER_COMMAND_NAME = "insertDivider";

function getInsertionPoint(input: CommandInput): Point | undefined {
  const selection = input.context.selection;

  if (
    !selection ||
    !isCollapsed(selection) ||
    !isValidPoint(input.context.document, selection.anchor)
  ) {
    return undefined;
  }

  return selection.anchor;
}

export function canExecuteInsertDividerCommand(input: CommandInput): boolean {
  return getInsertionPoint(input) !== undefined;
}

export const insertDividerCommand: Command = {
  canExecute: canExecuteInsertDividerCommand,
  execute(input) {
    const point = getInsertionPoint(input);
    const [blockIndex] = point?.path ?? [];

    if (!point || blockIndex === undefined) {
      return createCommandSkipped(
        INSERT_DIVIDER_COMMAND_NAME,
        "Insert divider command requires a collapsed text selection.",
      );
    }

    const nextPoint = { offset: 0, path: [blockIndex + 2, 0] };

    return createCommandSuccess(INSERT_DIVIDER_COMMAND_NAME, {
      selection: {
        anchor: nextPoint,
        focus: { ...nextPoint, path: [...nextPoint.path] },
      },
      transaction: createTransaction([
        createSplitBlockOperation(point),
        createInsertBlockOperation([blockIndex + 1], createDivider()),
      ]),
    });
  },
  name: INSERT_DIVIDER_COMMAND_NAME,
};
