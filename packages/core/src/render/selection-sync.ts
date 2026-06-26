import type { DocumentNode } from "../model";
import { normalizeRange, type RangeSelection } from "../selection";
import {
  domPointToModelPoint,
  modelPointToDomPoint,
  type DomPoint,
} from "./dom-mapping";

function getOwnerDocument(root: ParentNode): Document | undefined {
  return root instanceof Document ? root : (root.ownerDocument ?? undefined);
}

function toDomPoint(node: Node | null, offset: number): DomPoint | undefined {
  return node
    ? {
        node,
        offset,
      }
    : undefined;
}

export function domSelectionToModelSelection(
  document: DocumentNode,
  selection: Selection,
): RangeSelection | undefined {
  if (selection.rangeCount === 0) {
    return undefined;
  }

  const anchor = toDomPoint(selection.anchorNode, selection.anchorOffset);
  const focus = toDomPoint(selection.focusNode, selection.focusOffset);
  const modelAnchor = anchor ? domPointToModelPoint(document, anchor) : undefined;
  const modelFocus = focus ? domPointToModelPoint(document, focus) : undefined;

  return modelAnchor && modelFocus
    ? {
        anchor: modelAnchor,
        focus: modelFocus,
      }
    : undefined;
}

export function createDomRangeFromModelSelection(
  root: ParentNode,
  document: DocumentNode,
  selection: RangeSelection,
): Range | undefined {
  const ownerDocument = getOwnerDocument(root);
  const normalizedSelection = normalizeRange(selection);
  const anchor = modelPointToDomPoint(root, document, normalizedSelection.anchor);
  const focus = modelPointToDomPoint(root, document, normalizedSelection.focus);

  if (!ownerDocument || !anchor || !focus) {
    return undefined;
  }

  const range = ownerDocument.createRange();
  range.setStart(anchor.node, anchor.offset);
  range.setEnd(focus.node, focus.offset);

  return range;
}

export function applyModelSelectionToDom(
  root: ParentNode,
  document: DocumentNode,
  selection: RangeSelection,
  domSelection = getOwnerDocument(root)?.getSelection(),
): boolean {
  const range = createDomRangeFromModelSelection(root, document, selection);

  if (!range || !domSelection) {
    return false;
  }

  domSelection.removeAllRanges();
  domSelection.addRange(range);

  return true;
}
