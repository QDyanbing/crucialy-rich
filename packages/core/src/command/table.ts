import {
  createParagraph,
  createTable,
  isListNode,
  isTableNode,
  isTextBlockNode,
  type BlockNode,
  type TableNode,
} from "../model";
import {
  createInsertBlockOperation,
  createRemoveBlockOperation,
  createSplitBlockOperation,
  createTransaction,
  type Operation,
} from "../operation";
import {
  getNodeAtPath,
  isCollapsed,
  isValidPoint,
  type Path,
  type Point,
  type RangeSelection,
} from "../selection";
import { createCommandSkipped, createCommandSuccess } from "./result";
import type { Command, CommandInput } from "./types";

export const INSERT_TABLE_COMMAND_NAME = "insertTable";
export const DELETE_TABLE_COMMAND_NAME = "deleteTable";

export interface TableCommandPayload {
  path: Path;
}

interface TableCommandTarget {
  index: number;
  path: Path;
  table: TableNode;
}

function getTableTarget(input: CommandInput): TableCommandTarget | undefined {
  const payload = input.payload;

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("path" in payload) ||
    !Array.isArray(payload.path) ||
    payload.path.length !== 1 ||
    !payload.path.every(
      (part) => typeof part === "number" && Number.isInteger(part) && part >= 0,
    )
  ) {
    return undefined;
  }

  const path = [...payload.path];
  const node = getNodeAtPath(input.context.document, path);

  return isTableNode(node) ? { index: path[0]!, path, table: node } : undefined;
}

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

function createTextBlockPoint(
  block: BlockNode,
  blockIndex: number,
  atEnd: boolean,
): Point | undefined {
  if (isTextBlockNode(block)) {
    const textIndex = atEnd ? block.children.length - 1 : 0;
    const text = block.children[textIndex];

    return text
      ? { offset: atEnd ? text.text.length : 0, path: [blockIndex, textIndex] }
      : undefined;
  }

  if (isListNode(block)) {
    const itemIndex = atEnd ? block.children.length - 1 : 0;
    const item = block.children[itemIndex];
    const textIndex = item && atEnd ? item.children.length - 1 : 0;
    const text = item?.children[textIndex];

    return text
      ? {
          offset: atEnd ? text.text.length : 0,
          path: [blockIndex, itemIndex, textIndex],
        }
      : undefined;
  }

  return undefined;
}

function createRangeAtPoint(point: Point): RangeSelection {
  return {
    anchor: point,
    focus: { offset: point.offset, path: [...point.path] },
  };
}

function createDeleteTableResult(
  input: CommandInput,
  target: TableCommandTarget,
  commandName: string,
) {
  const tableIndex = target.index;
  const operations: Operation[] = [createRemoveBlockOperation(target.path)];
  const remainingBlocks = input.context.document.children.filter(
    (_, index) => index !== tableIndex,
  );
  let point: Point | undefined;

  for (let index = tableIndex; index < remainingBlocks.length && !point; index += 1) {
    point = createTextBlockPoint(remainingBlocks[index]!, index, false);
  }

  for (let index = tableIndex - 1; index >= 0 && !point; index -= 1) {
    point = createTextBlockPoint(remainingBlocks[index]!, index, true);
  }

  if (!point) {
    point = { offset: 0, path: [remainingBlocks.length, 0] };
    operations.push(
      createInsertBlockOperation([remainingBlocks.length], createParagraph()),
    );
  }

  return createCommandSuccess(commandName, {
    selection: createRangeAtPoint(point),
    transaction: createTransaction(operations),
  });
}

export function canExecuteDeleteTableCommand(input: CommandInput): boolean {
  return getTableTarget(input) !== undefined;
}

export const deleteTableCommand: Command = {
  canExecute: canExecuteDeleteTableCommand,
  execute(input) {
    const target = getTableTarget(input);

    return target
      ? createDeleteTableResult(input, target, DELETE_TABLE_COMMAND_NAME)
      : createCommandSkipped(
          DELETE_TABLE_COMMAND_NAME,
          "Delete table command requires a top-level table path.",
        );
  },
  name: DELETE_TABLE_COMMAND_NAME,
};
