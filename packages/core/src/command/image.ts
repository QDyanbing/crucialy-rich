import {
  createImage,
  createParagraph,
  isImageStatus,
  isListNode,
  isTextBlockNode,
  normalizeImageDimension,
  sanitizeImageSrc,
  type BlockNode,
  type ImageStatus,
} from "../model";
import {
  createInsertBlockOperation,
  createRemoveBlockOperation,
  createSplitBlockOperation,
  createTransaction,
  type Operation,
} from "../operation";
import {
  isCollapsed,
  isImageBlockSelection,
  isValidPoint,
  type BlockSelection,
  type Point,
  type RangeSelection,
} from "../selection";
import { createCommandSkipped, createCommandSuccess } from "./result";
import type { Command, CommandInput } from "./types";

export const INSERT_IMAGE_COMMAND_NAME = "insertImage";
export const DELETE_IMAGE_COMMAND_NAME = "deleteImage";

export interface InsertImageCommandPayload {
  alt?: string;
  height?: number | null;
  src: string;
  status?: ImageStatus;
  width?: number | null;
}

export interface DeleteImageCommandPayload {
  selection: BlockSelection;
}

interface ImageCommandTarget {
  alt: string;
  height: number | null;
  point: Point;
  src: string;
  status: ImageStatus;
  width: number | null;
}

function getImageCommandTarget(input: CommandInput): ImageCommandTarget | undefined {
  const selection = input.context.selection;
  const payload = input.payload;

  if (
    !selection ||
    !isCollapsed(selection) ||
    selection.anchor.path.length !== 2 ||
    !isValidPoint(input.context.document, selection.anchor) ||
    typeof payload !== "object" ||
    payload === null ||
    !("src" in payload)
  ) {
    return undefined;
  }

  const src = sanitizeImageSrc(payload.src);
  const alt = "alt" in payload ? payload.alt : undefined;
  const height = "height" in payload ? payload.height : undefined;
  const status = "status" in payload ? payload.status : undefined;
  const width = "width" in payload ? payload.width : undefined;

  if (
    !src ||
    (alt !== undefined && typeof alt !== "string") ||
    (height !== undefined &&
      height !== null &&
      normalizeImageDimension(height) === null) ||
    (status !== undefined && !isImageStatus(status)) ||
    (width !== undefined && width !== null && normalizeImageDimension(width) === null)
  ) {
    return undefined;
  }

  return {
    alt: alt ?? "",
    height: normalizeImageDimension(height),
    point: selection.anchor,
    src,
    status: status ?? "ready",
    width: normalizeImageDimension(width),
  };
}

export function canExecuteInsertImageCommand(input: CommandInput): boolean {
  return getImageCommandTarget(input) !== undefined;
}

export const insertImageCommand: Command = {
  canExecute: canExecuteInsertImageCommand,
  execute(input) {
    const target = getImageCommandTarget(input);
    const [blockIndex] = target?.point.path ?? [];

    if (!target || blockIndex === undefined) {
      return createCommandSkipped(
        INSERT_IMAGE_COMMAND_NAME,
        "Insert image command requires valid image metadata and a collapsed text selection.",
      );
    }

    const nextPoint = { offset: 0, path: [blockIndex + 2, 0] };
    const image = createImage(target.src, {
      alt: target.alt,
      height: target.height,
      status: target.status,
      width: target.width,
    });

    return createCommandSuccess(INSERT_IMAGE_COMMAND_NAME, {
      selection: {
        anchor: nextPoint,
        focus: { ...nextPoint, path: [...nextPoint.path] },
      },
      transaction: createTransaction([
        createSplitBlockOperation(target.point),
        createInsertBlockOperation([blockIndex + 1], image),
      ]),
    });
  },
  name: INSERT_IMAGE_COMMAND_NAME,
};

function resolveImageSelection(input: CommandInput): BlockSelection | undefined {
  const payload = input.payload;

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("selection" in payload) ||
    typeof payload.selection !== "object" ||
    payload.selection === null ||
    !("type" in payload.selection) ||
    payload.selection.type !== "block" ||
    !("path" in payload.selection) ||
    !Array.isArray(payload.selection.path)
  ) {
    return undefined;
  }

  const selection = payload.selection as BlockSelection;

  return isImageBlockSelection(input.context.document, selection)
    ? selection
    : undefined;
}

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

export function canExecuteDeleteImageCommand(input: CommandInput): boolean {
  return resolveImageSelection(input) !== undefined;
}

export const deleteImageCommand: Command = {
  canExecute: canExecuteDeleteImageCommand,
  execute(input) {
    const selection = resolveImageSelection(input);
    const [imageIndex] = selection?.path ?? [];

    if (!selection || imageIndex === undefined) {
      return createCommandSkipped(
        DELETE_IMAGE_COMMAND_NAME,
        "Delete image command requires a selected image block.",
      );
    }

    const operations: Operation[] = [createRemoveBlockOperation(selection.path)];
    const remainingBlocks = input.context.document.children.filter(
      (_, index) => index !== imageIndex,
    );
    let point: Point | undefined;

    for (let index = imageIndex; index < remainingBlocks.length && !point; index += 1) {
      point = createTextBlockPoint(remainingBlocks[index]!, index, false);
    }

    for (let index = imageIndex - 1; index >= 0 && !point; index -= 1) {
      point = createTextBlockPoint(remainingBlocks[index]!, index, true);
    }

    if (!point) {
      point = { offset: 0, path: [remainingBlocks.length, 0] };
      operations.push(
        createInsertBlockOperation([remainingBlocks.length], createParagraph()),
      );
    }

    return createCommandSuccess(DELETE_IMAGE_COMMAND_NAME, {
      selection: createRangeAtPoint(point),
      transaction: createTransaction(operations),
    });
  },
  name: DELETE_IMAGE_COMMAND_NAME,
};
