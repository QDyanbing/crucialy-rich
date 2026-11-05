import { isListEntryNode, isTextBlockNode, type DocumentNode } from "../model";
import {
  getNodeAtPath,
  getPointAtTextContainerOffset,
  getTextContainerOffset,
  isValidPoint,
  type Point,
  type RangeSelection,
} from "../selection";

let segmenter: Intl.Segmenter | undefined;

export function createCharacterDeletionRange(
  document: DocumentNode,
  point: Point,
  direction: "backward" | "forward",
): RangeSelection | undefined {
  if (!isValidPoint(document, point)) return undefined;
  const containerPath = point.path.slice(0, -1);
  const container = getNodeAtPath(document, containerPath);
  const offset = getTextContainerOffset(document, point);
  if (
    offset === undefined ||
    (!isTextBlockNode(container) && !isListEntryNode(container))
  )
    return undefined;

  const text = container.children.map((node) => node.text).join("");
  segmenter ??= new Intl.Segmenter(undefined, { granularity: "grapheme" });
  for (const part of segmenter.segment(text)) {
    const end = part.index + part.segment.length;
    // A host may place a UTF-16 caret inside a grapheme; remove the whole cluster.
    const matches =
      direction === "backward"
        ? part.index < offset && offset <= end
        : part.index <= offset && offset < end;
    if (!matches) continue;
    const anchor = getPointAtTextContainerOffset(document, containerPath, part.index, {
      affinity: "forward",
    });
    const focus = getPointAtTextContainerOffset(document, containerPath, end);
    return anchor && focus ? { anchor, focus } : undefined;
  }
  return undefined;
}
