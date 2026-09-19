import {
  isListEntryNode,
  isTextBlockNode,
  type DocumentNode,
  type TextNode,
} from "../model";
import { getNodeAtPath } from "./path";
import type { PointAtBlockTextOffsetOptions } from "./paragraph-offset";
import type { Path, Point } from "./types";

function isTextOffset(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

function getTextChildren(
  document: DocumentNode,
  containerPath: Path,
): TextNode[] | undefined {
  const container = getNodeAtPath(document, containerPath);

  return isTextBlockNode(container) || isListEntryNode(container)
    ? container.children
    : undefined;
}

export function getTextContainerPath(point: Point): Path | undefined {
  return point.path.length > 1 ? point.path.slice(0, -1) : undefined;
}

export function getTextContainerOffset(
  document: DocumentNode,
  point: Point,
): number | undefined {
  if (!isTextOffset(point.offset)) {
    return undefined;
  }

  const containerPath = getTextContainerPath(point);
  const textIndex = point.path.at(-1);

  if (!containerPath || textIndex === undefined) {
    return undefined;
  }

  const children = getTextChildren(document, containerPath);
  const text = children?.[textIndex];

  if (!text || point.offset > text.text.length) {
    return undefined;
  }

  return (
    children
      .slice(0, textIndex)
      .reduce((offset, node) => offset + node.text.length, 0) + point.offset
  );
}

export function getPointAtTextContainerOffset(
  document: DocumentNode,
  containerPath: Path,
  textOffset: number,
  options: PointAtBlockTextOffsetOptions = {},
): Point | undefined {
  if (!isTextOffset(textOffset)) {
    return undefined;
  }

  const children = getTextChildren(document, containerPath);

  if (!children) {
    return undefined;
  }

  let cursor = 0;

  for (let textIndex = 0; textIndex < children.length; textIndex += 1) {
    const text = children[textIndex]!;
    const nextCursor = cursor + text.text.length;

    if (textOffset < nextCursor) {
      return {
        offset: textOffset - cursor,
        path: [...containerPath, textIndex],
      };
    }

    if (textOffset === nextCursor) {
      if (options.affinity === "forward" && children[textIndex + 1]) {
        cursor = nextCursor;
        continue;
      }

      return {
        offset: text.text.length,
        path: [...containerPath, textIndex],
      };
    }

    cursor = nextCursor;
  }

  return undefined;
}

export function isSameTextContainer(start: Point, end: Point): boolean {
  const startPath = getTextContainerPath(start);
  const endPath = getTextContainerPath(end);

  return (
    startPath !== undefined &&
    endPath !== undefined &&
    startPath.length === endPath.length &&
    startPath.every((index, position) => index === endPath[position])
  );
}
