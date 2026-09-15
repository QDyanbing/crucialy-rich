import {
  createParagraph,
  createTable,
  createTableCell,
  createTableRow,
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
export const ADD_ROW_BEFORE_COMMAND_NAME = "addRowBefore";
export const ADD_ROW_AFTER_COMMAND_NAME = "addRowAfter";
export const DELETE_ROW_COMMAND_NAME = "deleteRow";
export const ADD_COLUMN_BEFORE_COMMAND_NAME = "addColumnBefore";
export const ADD_COLUMN_AFTER_COMMAND_NAME = "addColumnAfter";

export interface TableCommandPayload {
  path: Path;
}

export interface TableRowCommandPayload extends TableCommandPayload {
  rowIndex: number;
}

export interface TableColumnCommandPayload extends TableCommandPayload {
  columnIndex: number;
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

interface IndexedTableCommandTarget extends TableCommandTarget {
  itemIndex: number;
}

function getIndexedTableTarget(
  input: CommandInput,
  key: "columnIndex" | "rowIndex",
): IndexedTableCommandTarget | undefined {
  const target = getTableTarget(input);
  const payload = input.payload;

  if (!target || typeof payload !== "object" || payload === null || !(key in payload)) {
    return undefined;
  }

  const itemIndex = (payload as Record<string, unknown>)[key];
  const itemCount =
    key === "rowIndex"
      ? target.table.children.length
      : (target.table.children[0]?.children.length ?? 0);

  return typeof itemIndex === "number" &&
    Number.isInteger(itemIndex) &&
    itemIndex >= 0 &&
    itemIndex < itemCount
    ? { ...target, itemIndex }
    : undefined;
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

function cloneRange(selection: RangeSelection): RangeSelection {
  return {
    anchor: { offset: selection.anchor.offset, path: [...selection.anchor.path] },
    focus: { offset: selection.focus.offset, path: [...selection.focus.path] },
  };
}

function createReplaceTableResult(
  input: CommandInput,
  target: TableCommandTarget,
  table: TableNode,
  commandName: string,
) {
  return createCommandSuccess(commandName, {
    ...(input.context.selection
      ? { selection: cloneRange(input.context.selection) }
      : {}),
    transaction: createTransaction([
      createRemoveBlockOperation(target.path),
      createInsertBlockOperation(target.path, table),
    ]),
  });
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

function createAddRowCommand(
  name: typeof ADD_ROW_AFTER_COMMAND_NAME | typeof ADD_ROW_BEFORE_COMMAND_NAME,
  offset: 0 | 1,
): Command {
  return {
    canExecute(input) {
      return getIndexedTableTarget(input, "rowIndex") !== undefined;
    },
    execute(input) {
      const target = getIndexedTableTarget(input, "rowIndex");

      if (!target) {
        return createCommandSkipped(name, "Row command requires a valid table row.");
      }

      const columnCount = target.table.children[0]?.children.length ?? 1;
      const insertionIndex = target.itemIndex + offset;
      const row = createTableRow(
        Array.from({ length: columnCount }, () => createTableCell()),
      );
      const table: TableNode = {
        children: [
          ...target.table.children.slice(0, insertionIndex),
          row,
          ...target.table.children.slice(insertionIndex),
        ],
        type: "table",
      };

      return createReplaceTableResult(input, target, table, name);
    },
    name,
  };
}

export const addRowBeforeCommand = createAddRowCommand(ADD_ROW_BEFORE_COMMAND_NAME, 0);
export const addRowAfterCommand = createAddRowCommand(ADD_ROW_AFTER_COMMAND_NAME, 1);

export function canExecuteAddRowBeforeCommand(input: CommandInput): boolean {
  return addRowBeforeCommand.canExecute?.(input) ?? false;
}

export function canExecuteAddRowAfterCommand(input: CommandInput): boolean {
  return addRowAfterCommand.canExecute?.(input) ?? false;
}

export function canExecuteDeleteRowCommand(input: CommandInput): boolean {
  return getIndexedTableTarget(input, "rowIndex") !== undefined;
}

export const deleteRowCommand: Command = {
  canExecute: canExecuteDeleteRowCommand,
  execute(input) {
    const target = getIndexedTableTarget(input, "rowIndex");

    if (!target) {
      return createCommandSkipped(
        DELETE_ROW_COMMAND_NAME,
        "Delete row command requires a valid table row.",
      );
    }

    if (target.table.children.length === 1) {
      return createDeleteTableResult(input, target, DELETE_ROW_COMMAND_NAME);
    }

    return createReplaceTableResult(
      input,
      target,
      {
        children: target.table.children.filter(
          (_, rowIndex) => rowIndex !== target.itemIndex,
        ),
        type: "table",
      },
      DELETE_ROW_COMMAND_NAME,
    );
  },
  name: DELETE_ROW_COMMAND_NAME,
};

function createAddColumnCommand(
  name: typeof ADD_COLUMN_AFTER_COMMAND_NAME | typeof ADD_COLUMN_BEFORE_COMMAND_NAME,
  offset: 0 | 1,
): Command {
  return {
    canExecute(input) {
      return getIndexedTableTarget(input, "columnIndex") !== undefined;
    },
    execute(input) {
      const target = getIndexedTableTarget(input, "columnIndex");

      if (!target) {
        return createCommandSkipped(
          name,
          "Column command requires a valid table column.",
        );
      }

      const insertionIndex = target.itemIndex + offset;
      const table: TableNode = {
        children: target.table.children.map((row) =>
          createTableRow([
            ...row.children.slice(0, insertionIndex),
            createTableCell(),
            ...row.children.slice(insertionIndex),
          ]),
        ),
        type: "table",
      };

      return createReplaceTableResult(input, target, table, name);
    },
    name,
  };
}

export const addColumnBeforeCommand = createAddColumnCommand(
  ADD_COLUMN_BEFORE_COMMAND_NAME,
  0,
);
export const addColumnAfterCommand = createAddColumnCommand(
  ADD_COLUMN_AFTER_COMMAND_NAME,
  1,
);

export function canExecuteAddColumnBeforeCommand(input: CommandInput): boolean {
  return addColumnBeforeCommand.canExecute?.(input) ?? false;
}

export function canExecuteAddColumnAfterCommand(input: CommandInput): boolean {
  return addColumnAfterCommand.canExecute?.(input) ?? false;
}
