import type { DocumentNode } from "../model";
import { isValidPoint } from "./point";
import { normalizeRange } from "./range";
import type { Path, Point, RangeSelection } from "./types";

interface LinearSegment {
  path?: Path;
  start: number;
  end: number;
  text: string;
}

export interface TextRangeSplit {
  before: string;
  selected: string;
  after: string;
}

function isSamePath(left: Path, right: Path): boolean {
  return (
    left.length === right.length && left.every((part, index) => part === right[index])
  );
}

function createLinearSegments(document: DocumentNode): LinearSegment[] {
  const segments: LinearSegment[] = [];
  let cursor = 0;

  document.children.forEach((block, blockIndex) => {
    block.children.forEach((node, textIndex) => {
      segments.push({
        path: [blockIndex, textIndex],
        start: cursor,
        end: cursor + node.text.length,
        text: node.text,
      });
      cursor += node.text.length;
    });

    if (blockIndex < document.children.length - 1) {
      segments.push({
        start: cursor,
        end: cursor + 1,
        text: "\n",
      });
      cursor += 1;
    }
  });

  return segments;
}

function getPointTextOffset(document: DocumentNode, point: Point): number | undefined {
  if (!isValidPoint(document, point)) {
    return undefined;
  }

  const segment = createLinearSegments(document).find(
    (item) => item.path && isSamePath(item.path, point.path),
  );

  return segment ? segment.start + point.offset : undefined;
}

function getRangeTextOffsets(
  document: DocumentNode,
  range: RangeSelection,
): { startOffset: number; endOffset: number } {
  const normalizedRange = normalizeRange(range);
  const startOffset = getPointTextOffset(document, normalizedRange.anchor);
  const endOffset = getPointTextOffset(document, normalizedRange.focus);

  if (startOffset === undefined || endOffset === undefined) {
    throw new RangeError("range points must reference text nodes");
  }

  return { startOffset, endOffset };
}

function readLinearText(
  document: DocumentNode,
  startOffset: number,
  endOffset: number,
): string {
  return createLinearSegments(document)
    .map((segment) => {
      const start = Math.max(segment.start, startOffset);
      const end = Math.min(segment.end, endOffset);

      if (start >= end) {
        return "";
      }

      return segment.text.slice(start - segment.start, end - segment.start);
    })
    .join("");
}

function readDocumentText(document: DocumentNode): string {
  return createLinearSegments(document)
    .map((segment) => segment.text)
    .join("");
}

export function getTextInRange(document: DocumentNode, range: RangeSelection): string {
  const { startOffset, endOffset } = getRangeTextOffsets(document, range);

  return readLinearText(document, startOffset, endOffset);
}

export function splitTextByRange(
  document: DocumentNode,
  range: RangeSelection,
): TextRangeSplit {
  const { startOffset, endOffset } = getRangeTextOffsets(document, range);
  const text = readDocumentText(document);

  return {
    before: text.slice(0, startOffset),
    selected: text.slice(startOffset, endOffset),
    after: text.slice(endOffset),
  };
}
