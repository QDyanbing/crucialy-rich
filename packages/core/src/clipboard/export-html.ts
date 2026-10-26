import {
  createDocument,
  isTextNode,
  normalizeDocument,
  type DocumentNode,
} from "../model";
import { renderDocument, renderNodeToHtml, type RenderedElementNode } from "../render";
import { getNodeAtPath, type RangeSelection } from "../selection";
import { getClipboardTextBlocks } from "./selection-blocks";
import { getClipboardList } from "./selection-list";
import { getClipboardTable } from "./selection-table";

const clipboardAttributes: Partial<
  Record<RenderedElementNode["tagName"], readonly string[]>
> = {
  a: ["href", "target", "rel"],
  ol: ["start"],
  input: ["type", "checked"],
};

function toClipboardNode(
  node: RenderedElementNode,
  document: DocumentNode,
): RenderedElementNode {
  const allowed = clipboardAttributes[node.tagName] ?? [];
  const attributes = Object.fromEntries(
    Object.entries(node.attributes).filter(([name]) => allowed.includes(name)),
  );
  const result: RenderedElementNode = {
    ...node,
    attributes,
    ...(node.children
      ? { children: node.children.map((child) => toClipboardNode(child, document)) }
      : {}),
  };
  if (node.tagName === "a") {
    const source = getNodeAtPath(document, node.path);
    if (isTextNode(source)) {
      const textDecoration = [
        source.marks?.underline ? "underline" : undefined,
        source.marks?.strike ? "line-through" : undefined,
      ]
        .filter(Boolean)
        .join(" ");
      result.style = { ...node.style };
      delete result.style.textDecoration;
      if (textDecoration) result.style.textDecoration = textDecoration;
    }
  }
  if (
    node.tagName === "a" &&
    node.style?.fontFamily === "monospace" &&
    node.text !== undefined
  ) {
    const { text, ...link } = result;
    return {
      ...link,
      children: [{ tagName: "code", path: [], attributes: {}, text: text! }],
    };
  }
  return result;
}

export function getClipboardHtml(
  document: DocumentNode,
  selection: RangeSelection,
): string | undefined {
  const structure =
    getClipboardList(document, selection) ?? getClipboardTable(document, selection);
  const blocks = structure ? [structure] : getClipboardTextBlocks(document, selection);
  if (!blocks) return undefined;
  const fragment = normalizeDocument(createDocument(blocks));
  const rendered = renderDocument(fragment);
  return rendered.children
    ?.map((node) => renderNodeToHtml(toClipboardNode(node, fragment)))
    .join("");
}
