import { createDocument, normalizeDocument, type DocumentNode } from "../model";
import { renderDocument, renderNodeToHtml, type RenderedElementNode } from "../render";
import type { RangeSelection } from "../selection";
import { getClipboardTextBlocks } from "./selection-blocks";

function toClipboardNode(node: RenderedElementNode): RenderedElementNode {
  const attributes =
    node.tagName === "a"
      ? Object.fromEntries(
          Object.entries(node.attributes).filter(
            ([name]) => name === "href" || name === "target" || name === "rel",
          ),
        )
      : {};
  return {
    ...node,
    attributes,
    ...(node.children ? { children: node.children.map(toClipboardNode) } : {}),
  };
}

export function getClipboardHtml(
  document: DocumentNode,
  selection: RangeSelection,
): string | undefined {
  const blocks = getClipboardTextBlocks(document, selection);
  if (!blocks) return undefined;
  const rendered = renderDocument(normalizeDocument(createDocument(blocks)));
  return rendered.children
    ?.map((node) => renderNodeToHtml(toClipboardNode(node)))
    .join("");
}
