import {
  createCodeBlock,
  isHeadingLevel,
  type BlockNode,
  type DocumentNode,
} from "../model";
import type { Path } from "../selection";
import type { BlockTypeSpec, SetBlockTypeOperation } from "./types";

function cloneBlockTypeSpec(block: BlockTypeSpec): BlockTypeSpec {
  return block.type === "heading" ? { ...block } : { type: block.type };
}

function isValidBlockTypeSpec(block: BlockTypeSpec): boolean {
  switch (block.type) {
    case "heading":
      return isHeadingLevel(block.level);
    case "codeBlock":
    case "paragraph":
    case "quote":
      return true;
    default:
      return false;
  }
}

function getBlockIndex(document: DocumentNode, path: Path): number {
  const [blockIndex] = path;

  if (
    path.length !== 1 ||
    blockIndex === undefined ||
    !Number.isInteger(blockIndex) ||
    blockIndex < 0 ||
    document.children[blockIndex] === undefined
  ) {
    throw new RangeError("set block type path must reference a block node");
  }

  return blockIndex;
}

function createBlockWithType(source: BlockNode, target: BlockTypeSpec): BlockNode {
  switch (target.type) {
    case "codeBlock":
      return createCodeBlock(source.children);
    case "heading":
      return { children: source.children, level: target.level, type: "heading" };
    case "paragraph":
      return { children: source.children, type: "paragraph" };
    case "quote":
      return { children: source.children, type: "quote" };
  }
}

function hasBlockType(block: BlockNode, target: BlockTypeSpec): boolean {
  return (
    block.type === target.type &&
    (block.type !== "heading" ||
      (target.type === "heading" && block.level === target.level))
  );
}

export function createSetBlockTypeOperation(
  path: Path,
  block: BlockTypeSpec,
): SetBlockTypeOperation {
  if (!isValidBlockTypeSpec(block)) {
    throw new RangeError("invalid block type target");
  }

  return {
    block: cloneBlockTypeSpec(block),
    path: [...path],
    type: "set_block_type",
  };
}

export function applySetBlockType(
  document: DocumentNode,
  operation: SetBlockTypeOperation,
): DocumentNode {
  const blockIndex = getBlockIndex(document, operation.path);

  if (!isValidBlockTypeSpec(operation.block)) {
    throw new RangeError("invalid block type target");
  }

  const block = document.children[blockIndex]!;

  if (hasBlockType(block, operation.block)) {
    return document;
  }

  return {
    ...document,
    children: document.children.map((child, index) =>
      index === blockIndex ? createBlockWithType(child, operation.block) : child,
    ),
  };
}
