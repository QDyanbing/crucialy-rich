import type { DocumentNode } from "../model";
import type { Point } from "./types";

export type TextOffsetAffinity = "backward" | "forward";

export interface PointAtParagraphTextOffsetOptions {
  affinity?: TextOffsetAffinity;
}

function isTextOffset(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

export function getParagraphTextOffset(
  document: DocumentNode,
  point: Point,
): number | undefined {
  if (!isTextOffset(point.offset)) {
    return undefined;
  }

  const [blockIndex, textIndex] = point.path;
  const block = blockIndex === undefined ? undefined : document.children[blockIndex];
  const text = textIndex === undefined ? undefined : block?.children[textIndex];

  if (!block || !text || point.offset > text.text.length) {
    return undefined;
  }

  return (
    block.children
      .slice(0, textIndex)
      .reduce((offset, node) => offset + node.text.length, 0) + point.offset
  );
}

export function getPointAtParagraphTextOffset(
  document: DocumentNode,
  blockIndex: number,
  textOffset: number,
  options: PointAtParagraphTextOffsetOptions = {},
): Point | undefined {
  if (!isTextOffset(textOffset)) {
    return undefined;
  }

  const block = document.children[blockIndex];

  if (!block) {
    return undefined;
  }

  let cursor = 0;

  for (let textIndex = 0; textIndex < block.children.length; textIndex += 1) {
    const text = block.children[textIndex]!;
    const nextCursor = cursor + text.text.length;

    if (textOffset < nextCursor) {
      return {
        offset: textOffset - cursor,
        path: [blockIndex, textIndex],
      };
    }

    if (textOffset === nextCursor) {
      const hasNextText = block.children[textIndex + 1] !== undefined;

      if (options.affinity === "forward" && hasNextText) {
        cursor = nextCursor;
        continue;
      }

      return {
        offset: text.text.length,
        path: [blockIndex, textIndex],
      };
    }

    cursor = nextCursor;
  }

  return undefined;
}
