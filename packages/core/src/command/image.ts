import {
  createImage,
  isImageStatus,
  normalizeImageDimension,
  sanitizeImageSrc,
  type ImageStatus,
} from "../model";
import {
  createInsertBlockOperation,
  createSplitBlockOperation,
  createTransaction,
} from "../operation";
import { isCollapsed, isValidPoint, type Point } from "../selection";
import { createCommandSkipped, createCommandSuccess } from "./result";
import type { Command, CommandInput } from "./types";

export const INSERT_IMAGE_COMMAND_NAME = "insertImage";

export interface InsertImageCommandPayload {
  alt?: string;
  height?: number | null;
  src: string;
  status?: ImageStatus;
  width?: number | null;
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
