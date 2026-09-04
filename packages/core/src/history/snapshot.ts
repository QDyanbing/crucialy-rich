import { createText, type BlockNode, type DocumentNode } from "../model";
import type { Point, RangeSelection } from "../selection";
import type { HistorySnapshot } from "./types";

function cloneBlock(block: BlockNode): BlockNode {
  const children = block.children.map((textNode) =>
    createText(textNode.text, textNode.marks),
  );

  if (block.type === "heading") {
    return { children, level: block.level, type: "heading" };
  }

  switch (block.type) {
    case "codeBlock":
      return {
        children: block.children.map((textNode) => createText(textNode.text)),
        type: "codeBlock",
      };
    case "paragraph":
      return { children, type: "paragraph" };
    case "quote":
      return { children, type: "quote" };
  }
}

function cloneDocument(document: DocumentNode): DocumentNode {
  return {
    children: document.children.map(cloneBlock),
    type: "document",
  };
}

function clonePoint(point: Point): Point {
  return {
    path: [...point.path],
    offset: point.offset,
  };
}

function cloneSelection(selection: RangeSelection): RangeSelection {
  return {
    anchor: clonePoint(selection.anchor),
    focus: clonePoint(selection.focus),
  };
}

export function createHistorySnapshot(
  document: DocumentNode,
  selection?: RangeSelection,
): HistorySnapshot {
  return selection
    ? {
        document: cloneDocument(document),
        selection: cloneSelection(selection),
      }
    : {
        document: cloneDocument(document),
      };
}

export function cloneHistorySnapshot(snapshot: HistorySnapshot): HistorySnapshot {
  return createHistorySnapshot(snapshot.document, snapshot.selection);
}
