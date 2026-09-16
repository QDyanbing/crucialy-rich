import {
  createText,
  isParagraphNode,
  isTableNode,
  isTextBlockNode,
  type DocumentNode,
  type ParagraphNode,
  type TextBlockNode,
} from "../model";
import type { Point, RangeSelection } from "../selection";
import { isValidPoint } from "../selection";
import type { SplitBlockOperation } from "./types";

export function createSplitBlockOperation(point: Point): SplitBlockOperation {
  return {
    point: {
      path: [...point.path],
      offset: point.offset,
    },
    type: "split_block",
  };
}

function getSplitBlockIndexes(
  document: DocumentNode,
  operation: SplitBlockOperation,
): [number, number] {
  if (!isValidPoint(document, operation.point)) {
    throw new RangeError("split block point must reference a text node");
  }

  const [blockIndex, textIndex] = operation.point.path;

  if (blockIndex === undefined || textIndex === undefined) {
    throw new RangeError("split block point must reference a text node");
  }

  return [blockIndex, textIndex];
}

function ensureTextChildren(children: TextBlockNode["children"]) {
  return children.length > 0 ? children : [createText()];
}

function splitTextBlock(
  block: ParagraphNode,
  textIndex: number,
  offset: number,
): [ParagraphNode, ParagraphNode];
function splitTextBlock(
  block: TextBlockNode,
  textIndex: number,
  offset: number,
): [TextBlockNode, TextBlockNode];
function splitTextBlock(
  block: TextBlockNode,
  textIndex: number,
  offset: number,
): [TextBlockNode, TextBlockNode] {
  const textNode = block.children[textIndex]!;
  const leftText = {
    ...textNode,
    text: textNode.text.slice(0, offset),
  };
  const rightText = {
    ...textNode,
    text: textNode.text.slice(offset),
  };

  return [
    {
      ...block,
      children: ensureTextChildren([...block.children.slice(0, textIndex), leftText]),
    },
    {
      ...block,
      children: ensureTextChildren([rightText, ...block.children.slice(textIndex + 1)]),
    },
  ];
}

function splitTableParagraph(
  document: DocumentNode,
  operation: SplitBlockOperation,
): DocumentNode | undefined {
  const [blockIndex, rowIndex, cellIndex, paragraphIndex, textIndex] =
    operation.point.path;
  const table = blockIndex === undefined ? undefined : document.children[blockIndex];
  const row =
    rowIndex === undefined || !isTableNode(table)
      ? undefined
      : table.children[rowIndex];
  const cell = cellIndex === undefined ? undefined : row?.children[cellIndex];
  const paragraph =
    paragraphIndex === undefined ? undefined : cell?.children[paragraphIndex];

  if (
    operation.point.path.length !== 5 ||
    blockIndex === undefined ||
    rowIndex === undefined ||
    cellIndex === undefined ||
    paragraphIndex === undefined ||
    textIndex === undefined ||
    !isTableNode(table) ||
    !row ||
    !cell ||
    !isParagraphNode(paragraph)
  ) {
    return undefined;
  }

  const [leftParagraph, rightParagraph] = splitTextBlock(
    paragraph,
    textIndex,
    operation.point.offset,
  );
  const nextCell = {
    ...cell,
    children: [
      ...cell.children.slice(0, paragraphIndex),
      leftParagraph,
      rightParagraph,
      ...cell.children.slice(paragraphIndex + 1),
    ],
  };
  const nextRow = {
    ...row,
    children: [
      ...row.children.slice(0, cellIndex),
      nextCell,
      ...row.children.slice(cellIndex + 1),
    ],
  };
  const nextTable = {
    ...table,
    children: [
      ...table.children.slice(0, rowIndex),
      nextRow,
      ...table.children.slice(rowIndex + 1),
    ],
  };

  return {
    ...document,
    children: [
      ...document.children.slice(0, blockIndex),
      nextTable,
      ...document.children.slice(blockIndex + 1),
    ],
  };
}

export function applySplitBlock(
  document: DocumentNode,
  operation: SplitBlockOperation,
): DocumentNode {
  if (!isValidPoint(document, operation.point)) {
    throw new RangeError("split block point must reference a text node");
  }

  const tableResult = splitTableParagraph(document, operation);

  if (tableResult) {
    return tableResult;
  }

  const [blockIndex, textIndex] = getSplitBlockIndexes(document, operation);
  const block = document.children[blockIndex]!;

  if (!isTextBlockNode(block)) {
    throw new RangeError("split block point must reference a text block");
  }

  const [leftBlock, rightBlock] = splitTextBlock(
    block,
    textIndex,
    operation.point.offset,
  );

  return {
    ...document,
    children: [
      ...document.children.slice(0, blockIndex),
      leftBlock,
      rightBlock,
      ...document.children.slice(blockIndex + 1),
    ],
  };
}

export function createSelectionAfterSplitBlock(
  operation: SplitBlockOperation,
): RangeSelection {
  if (operation.point.path.length === 5) {
    const [blockIndex, rowIndex, cellIndex, paragraphIndex] = operation.point.path;
    const point = {
      path: [
        blockIndex ?? 0,
        rowIndex ?? 0,
        cellIndex ?? 0,
        (paragraphIndex ?? 0) + 1,
        0,
      ],
      offset: 0,
    };

    return {
      anchor: point,
      focus: { path: [...point.path], offset: point.offset },
    };
  }

  const [blockIndex] = operation.point.path;
  const point = {
    path: [blockIndex === undefined ? 0 : blockIndex + 1, 0],
    offset: 0,
  };

  return {
    anchor: point,
    focus: {
      path: [...point.path],
      offset: point.offset,
    },
  };
}
