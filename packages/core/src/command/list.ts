import {
  createBulletList,
  createListItem,
  createParagraph,
  isListNode,
  type DocumentNode,
  type ListNode,
  type ListType,
} from "../model";
import {
  createInsertBlockOperation,
  createRemoveBlockOperation,
  createTransaction,
  type Operation,
} from "../operation";
import { cloneRangeSelection, type Point, type RangeSelection } from "../selection";
import { getSelectedBlockIndexes } from "./block-selection";
import { createCommandSkipped, createCommandSuccess } from "./result";
import type { Command, CommandInput, CommandName, CommandResult } from "./types";

export const TOGGLE_BULLET_LIST_COMMAND_NAME = "toggleBulletList";

interface ParagraphListTarget {
  blockIndexes: number[];
  kind: "paragraphs";
}

interface ExistingListTarget {
  blockIndex: number;
  list: ListNode;
  kind: "list";
}

type ListCommandTarget = ExistingListTarget | ParagraphListTarget;

function getListCommandTarget(input: CommandInput): ListCommandTarget | undefined {
  const blockIndexes = getSelectedBlockIndexes(input);

  if (!blockIndexes || blockIndexes.length === 0) {
    return undefined;
  }

  if (blockIndexes.length === 1) {
    const blockIndex = blockIndexes[0]!;
    const block = input.context.document.children[blockIndex];

    if (isListNode(block)) {
      return { blockIndex, kind: "list", list: block };
    }
  }

  return blockIndexes.every(
    (blockIndex) => input.context.document.children[blockIndex]?.type === "paragraph",
  )
    ? { blockIndexes, kind: "paragraphs" }
    : undefined;
}

function mapPointToList(point: Point, firstBlockIndex: number): Point {
  const [blockIndex, textIndex] = point.path;

  return {
    offset: point.offset,
    path: [
      firstBlockIndex,
      (blockIndex ?? firstBlockIndex) - firstBlockIndex,
      textIndex ?? 0,
    ],
  };
}

function mapPointFromList(point: Point, listBlockIndex: number): Point {
  const [, itemIndex, textIndex] = point.path;

  return {
    offset: point.offset,
    path: [listBlockIndex + (itemIndex ?? 0), textIndex ?? 0],
  };
}

function mapSelection(
  selection: RangeSelection,
  mapPoint: (point: Point) => Point,
): RangeSelection {
  return {
    anchor: mapPoint(selection.anchor),
    focus: mapPoint(selection.focus),
  };
}

function createList(
  type: ListType,
  target: ParagraphListTarget,
  document: DocumentNode,
) {
  const items = target.blockIndexes.map((blockIndex) => {
    const block = document.children[blockIndex]!;

    return createListItem(block.type === "paragraph" ? block.children : undefined);
  });

  return type === "bulletList"
    ? createBulletList(items)
    : { children: items, type: "orderedList" as const };
}

function createWrapResult(
  commandName: CommandName,
  input: CommandInput,
  target: ParagraphListTarget,
  type: ListType,
): CommandResult {
  const firstBlockIndex = target.blockIndexes[0]!;
  const operations: Operation[] = target.blockIndexes.map(() =>
    createRemoveBlockOperation([firstBlockIndex]),
  );
  operations.push(
    createInsertBlockOperation(
      [firstBlockIndex],
      createList(type, target, input.context.document),
    ),
  );

  return createCommandSuccess(commandName, {
    selection: mapSelection(input.context.selection!, (point) =>
      mapPointToList(point, firstBlockIndex),
    ),
    transaction: createTransaction(operations),
  });
}

function createUnwrapResult(
  commandName: CommandName,
  input: CommandInput,
  target: ExistingListTarget,
): CommandResult {
  const operations: Operation[] = [createRemoveBlockOperation([target.blockIndex])];

  target.list.children.forEach((item, itemIndex) => {
    operations.push(
      createInsertBlockOperation(
        [target.blockIndex + itemIndex],
        createParagraph(item.children),
      ),
    );
  });

  return createCommandSuccess(commandName, {
    selection: mapSelection(input.context.selection!, (point) =>
      mapPointFromList(point, target.blockIndex),
    ),
    transaction: createTransaction(operations),
  });
}

function executeToggleList(
  commandName: CommandName,
  type: ListType,
  input: CommandInput,
): CommandResult {
  const target = getListCommandTarget(input);

  if (!target || !input.context.selection) {
    return createCommandSkipped(
      commandName,
      "List command requires paragraphs or one list selection.",
    );
  }

  if (target.kind === "paragraphs") {
    return createWrapResult(commandName, input, target, type);
  }

  if (target.list.type === type) {
    return createUnwrapResult(commandName, input, target);
  }

  return createCommandSuccess(commandName, {
    selection: cloneRangeSelection(input.context.selection),
    transaction: createTransaction([
      createRemoveBlockOperation([target.blockIndex]),
      createInsertBlockOperation([target.blockIndex], {
        children: target.list.children,
        type,
      }),
    ]),
  });
}

export function canExecuteToggleBulletListCommand(input: CommandInput): boolean {
  return getListCommandTarget(input) !== undefined;
}

export function isBulletListCommandActive(input: CommandInput): boolean {
  const target = getListCommandTarget(input);

  return target?.kind === "list" && target.list.type === "bulletList";
}

export const toggleBulletListCommand: Command = {
  canExecute: canExecuteToggleBulletListCommand,
  execute(input) {
    return executeToggleList(TOGGLE_BULLET_LIST_COMMAND_NAME, "bulletList", input);
  },
  name: TOGGLE_BULLET_LIST_COMMAND_NAME,
};
