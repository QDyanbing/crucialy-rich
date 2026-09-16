import {
  isListNode,
  isTableNode,
  isTextBlockNode,
  type DocumentNode,
  type ListNode,
  type TableNode,
  type TextNode,
} from "../model";
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

  function appendSeparator(text = "\n") {
    segments.push({ start: cursor, end: cursor + text.length, text });
    cursor += text.length;
  }

  function appendTextNodes(nodes: TextNode[], path: Path) {
    nodes.forEach((node, textIndex) => {
      segments.push({
        path: [...path, textIndex],
        start: cursor,
        end: cursor + node.text.length,
        text: node.text,
      });
      cursor += node.text.length;
    });
  }

  function appendList(list: ListNode, path: Path) {
    list.children.forEach((item, itemIndex) => {
      const itemPath = [...path, itemIndex];

      appendTextNodes(item.children, itemPath);

      if (item.nested) {
        appendSeparator();
        appendList(item.nested, [...itemPath, item.children.length]);
      }

      if (itemIndex < list.children.length - 1) {
        appendSeparator();
      }
    });
  }

  function appendTable(table: TableNode, path: Path) {
    table.children.forEach((row, rowIndex) => {
      row.children.forEach((cell, cellIndex) => {
        cell.children.forEach((paragraph, paragraphIndex) => {
          appendTextNodes(paragraph.children, [
            ...path,
            rowIndex,
            cellIndex,
            paragraphIndex,
          ]);

          if (paragraphIndex < cell.children.length - 1) {
            appendSeparator();
          }
        });

        if (cellIndex < row.children.length - 1) {
          appendSeparator("\t");
        }
      });

      if (rowIndex < table.children.length - 1) {
        appendSeparator();
      }
    });
  }

  document.children.forEach((block, blockIndex) => {
    if (isListNode(block)) {
      appendList(block, [blockIndex]);
    } else if (isTableNode(block)) {
      appendTable(block, [blockIndex]);
    } else if (isTextBlockNode(block)) {
      appendTextNodes(block.children, [blockIndex]);
    }

    if (blockIndex < document.children.length - 1) {
      appendSeparator();
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
