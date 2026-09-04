import {
  createCodeBlock,
  createDivider,
  createHeading,
  createParagraph,
  createQuote,
  createText,
  type BlockNode,
  type DocumentNode,
} from "../model";
import type { Path } from "../selection";
import type { InsertBlockOperation } from "./types";

function cloneBlock(block: BlockNode): BlockNode {
  if (block.type === "divider") {
    return createDivider();
  }

  const children = block.children.map((node) => createText(node.text, node.marks));

  switch (block.type) {
    case "codeBlock":
      return createCodeBlock(children);
    case "heading":
      return createHeading(block.level, children);
    case "paragraph":
      return createParagraph(children);
    case "quote":
      return createQuote(children);
  }
}

export function createInsertBlockOperation(
  path: Path,
  block: BlockNode,
): InsertBlockOperation {
  return {
    block: cloneBlock(block),
    path: [...path],
    type: "insert_block",
  };
}

function getInsertIndex(
  document: DocumentNode,
  operation: InsertBlockOperation,
): number {
  const [blockIndex, ...rest] = operation.path;

  if (
    rest.length > 0 ||
    blockIndex === undefined ||
    !Number.isInteger(blockIndex) ||
    blockIndex < 0 ||
    blockIndex > document.children.length
  ) {
    throw new RangeError("insert block path must reference a document position");
  }

  return blockIndex;
}

export function applyInsertBlock(
  document: DocumentNode,
  operation: InsertBlockOperation,
): DocumentNode {
  const blockIndex = getInsertIndex(document, operation);

  return {
    ...document,
    children: [
      ...document.children.slice(0, blockIndex),
      cloneBlock(operation.block),
      ...document.children.slice(blockIndex),
    ],
  };
}
