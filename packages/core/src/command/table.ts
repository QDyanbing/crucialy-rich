import { createTable } from "../model";
import {
  createInsertBlockOperation,
  createSplitBlockOperation,
  createTransaction,
} from "../operation";
import { isCollapsed, isValidPoint, type Point } from "../selection";
import { createCommandSkipped, createCommandSuccess } from "./result";
import type { Command, CommandInput } from "./types";

export const INSERT_TABLE_COMMAND_NAME = "insertTable";

function getInsertionPoint(input: CommandInput): Point | undefined {
  const selection = input.context.selection;

  if (
    !selection ||
    !isCollapsed(selection) ||
    selection.anchor.path.length !== 2 ||
    !isValidPoint(input.context.document, selection.anchor)
  ) {
    return undefined;
  }

  return selection.anchor;
}

export function canExecuteInsertTableCommand(input: CommandInput): boolean {
  return getInsertionPoint(input) !== undefined;
}

export const insertTableCommand: Command = {
  canExecute: canExecuteInsertTableCommand,
  execute(input) {
    const point = getInsertionPoint(input);
    const [blockIndex] = point?.path ?? [];

    if (!point || blockIndex === undefined) {
      return createCommandSkipped(
        INSERT_TABLE_COMMAND_NAME,
        "Insert table command requires a collapsed text selection.",
      );
    }

    const nextPoint = { offset: 0, path: [blockIndex + 2, 0] };

    return createCommandSuccess(INSERT_TABLE_COMMAND_NAME, {
      selection: {
        anchor: nextPoint,
        focus: { ...nextPoint, path: [...nextPoint.path] },
      },
      transaction: createTransaction([
        createSplitBlockOperation(point),
        createInsertBlockOperation([blockIndex + 1], createTable()),
      ]),
    });
  },
  name: INSERT_TABLE_COMMAND_NAME,
};
