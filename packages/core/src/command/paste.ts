import {
  isBlockNode,
  isListNode,
  isParagraphNode,
  isTextBlockNode,
  type BlockNode,
} from "../model";
import {
  applyDeleteText,
  createDeleteTextOperation,
  createInsertBlockOperation,
  createInsertTextOperation,
  createSelectionAfterInsertText,
  createSplitBlockOperation,
  createTransaction,
  type Operation,
} from "../operation";
import {
  isCollapsed,
  isValidPoint,
  getBlockTextOffset,
  getPointAtBlockTextOffset,
  normalizeRange,
  type Point,
  type RangeSelection,
} from "../selection";
import {
  CLIPBOARD_MIME_TYPES,
  type ClipboardFragment,
  type ClipboardMimeType,
} from "../clipboard";
import { createCommandSkipped, createCommandSuccess } from "./result";
import type { Command, CommandInput } from "./types";

export const PASTE_COMMAND_NAME = "paste";

export interface PasteCommandPayload {
  fragment: ClipboardFragment;
}

interface PasteTarget {
  fragment: ClipboardFragment;
  insertionPoint: Point;
  range: RangeSelection;
}

function resolvePasteTarget(input: CommandInput): PasteTarget | undefined {
  const selection = input.context.selection;
  const payload = input.payload;

  if (
    !selection ||
    !isValidPoint(input.context.document, selection.anchor) ||
    !isValidPoint(input.context.document, selection.focus) ||
    typeof payload !== "object" ||
    payload === null ||
    !("fragment" in payload) ||
    typeof payload.fragment !== "object" ||
    payload.fragment === null ||
    !("blocks" in payload.fragment) ||
    !("mimeType" in payload.fragment) ||
    !Array.isArray(payload.fragment.blocks) ||
    payload.fragment.blocks.length === 0 ||
    !payload.fragment.blocks.every(isBlockNode) ||
    !CLIPBOARD_MIME_TYPES.includes(payload.fragment.mimeType as ClipboardMimeType)
  ) {
    return undefined;
  }

  const range = normalizeRange(selection);
  const [anchorBlockIndex] = range.anchor.path;
  const [focusBlockIndex] = range.focus.path;

  if (
    range.anchor.path.length !== 2 ||
    range.focus.path.length !== 2 ||
    anchorBlockIndex === undefined ||
    anchorBlockIndex !== focusBlockIndex
  ) {
    return undefined;
  }

  let insertionPoint: Point = {
    offset: range.anchor.offset,
    path: [...range.anchor.path],
  };

  if (!isCollapsed(range)) {
    const textOffset = getBlockTextOffset(input.context.document, range.anchor);
    const documentAfterDelete = applyDeleteText(
      input.context.document,
      createDeleteTextOperation(range),
    );
    const pointAfterDelete =
      textOffset === undefined
        ? undefined
        : getPointAtBlockTextOffset(documentAfterDelete, anchorBlockIndex, textOffset);

    if (!pointAfterDelete) {
      return undefined;
    }

    insertionPoint = pointAfterDelete;
  }

  return {
    fragment: payload.fragment as ClipboardFragment,
    insertionPoint,
    range,
  };
}

function getLastTextPoint(block: BlockNode, blockIndex: number) {
  if (isTextBlockNode(block)) {
    const textIndex = block.children.length - 1;
    const text = block.children[textIndex];

    return text
      ? { offset: text.text.length, path: [blockIndex, textIndex] }
      : undefined;
  }

  if (isListNode(block)) {
    const itemIndex = block.children.length - 1;
    const item = block.children[itemIndex];
    const textIndex = item ? item.children.length - 1 : -1;
    const text = item?.children[textIndex];

    return text
      ? { offset: text.text.length, path: [blockIndex, itemIndex, textIndex] }
      : undefined;
  }

  return undefined;
}

function createPlainTextPasteResult(target: PasteTarget) {
  if (!target.fragment.blocks.every(isParagraphNode)) {
    return undefined;
  }

  const lines = target.fragment.blocks.map((block) =>
    block.children.map((node) => node.text).join(""),
  );
  const operations: Operation[] = isCollapsed(target.range)
    ? []
    : [createDeleteTextOperation(target.range)];
  let point = {
    offset: target.insertionPoint.offset,
    path: [...target.insertionPoint.path],
  };

  lines.forEach((line, index) => {
    const insertOperation = createInsertTextOperation(point, line);

    operations.push(insertOperation);
    point = createSelectionAfterInsertText(insertOperation).anchor;

    if (index < lines.length - 1) {
      const [blockIndex] = point.path;

      operations.push(createSplitBlockOperation(point));
      point = {
        offset: 0,
        path: [(blockIndex ?? 0) + 1, 0],
      };
    }
  });

  return { operations, point };
}

function createRichPasteResult(target: PasteTarget) {
  const [blockIndex] = target.insertionPoint.path;

  if (blockIndex === undefined) {
    return undefined;
  }

  const operations: Operation[] = isCollapsed(target.range)
    ? []
    : [createDeleteTextOperation(target.range)];

  operations.push(createSplitBlockOperation(target.insertionPoint));
  target.fragment.blocks.forEach((block, index) => {
    operations.push(createInsertBlockOperation([blockIndex + index + 1], block));
  });

  const lastBlock = target.fragment.blocks.at(-1)!;
  const lastBlockIndex = blockIndex + target.fragment.blocks.length;
  const point = getLastTextPoint(lastBlock, lastBlockIndex) ?? {
    offset: 0,
    path: [lastBlockIndex + 1, 0],
  };

  return { operations, point };
}

export function canExecutePasteCommand(input: CommandInput): boolean {
  return resolvePasteTarget(input) !== undefined;
}

export const pasteCommand: Command = {
  canExecute: canExecutePasteCommand,
  execute(input) {
    const target = resolvePasteTarget(input);

    if (!target) {
      return createCommandSkipped(
        PASTE_COMMAND_NAME,
        "Paste command requires a supported fragment and editable text selection.",
      );
    }

    const pasteResult =
      target.fragment.mimeType === "text/plain"
        ? createPlainTextPasteResult(target)
        : createRichPasteResult(target);

    if (!pasteResult) {
      return createCommandSkipped(
        PASTE_COMMAND_NAME,
        "Paste command received an unsupported clipboard fragment.",
      );
    }

    return createCommandSuccess(PASTE_COMMAND_NAME, {
      selection: {
        anchor: pasteResult.point,
        focus: {
          offset: pasteResult.point.offset,
          path: [...pasteResult.point.path],
        },
      },
      transaction: createTransaction(pasteResult.operations),
    });
  },
  name: PASTE_COMMAND_NAME,
};
