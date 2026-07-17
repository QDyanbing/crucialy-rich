import type { DocumentNode } from "../model";
import type { Point, RangeSelection } from "../selection";
import type { HistorySnapshot } from "./types";

function cloneDocument(document: DocumentNode): DocumentNode {
  return {
    type: "document",
    children: document.children.map((block) => ({
      type: "paragraph",
      children: block.children.map((textNode) => ({
        type: "text",
        text: textNode.text,
      })),
    })),
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
