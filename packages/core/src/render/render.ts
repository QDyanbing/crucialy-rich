import type { DocumentNode, ParagraphNode, TextNode } from "../model";
import type { Path } from "../selection";
import { createModelPathAttributes } from "./attributes";
import type { RenderedElementNode } from "./types";

function createRenderedNode(
  tagName: RenderedElementNode["tagName"],
  path: Path,
  options: Pick<RenderedElementNode, "children" | "text"> = {},
): RenderedElementNode {
  return {
    tagName,
    path,
    attributes: createModelPathAttributes(path),
    ...options,
  };
}

function renderTextNode(node: TextNode, path: Path): RenderedElementNode {
  return createRenderedNode("span", path, { text: node.text });
}

function renderParagraphNode(node: ParagraphNode, path: Path): RenderedElementNode {
  return createRenderedNode("p", path, {
    children: node.children.map((child, index) =>
      renderTextNode(child, [...path, index]),
    ),
  });
}

export function renderDocument(document: DocumentNode): RenderedElementNode {
  return createRenderedNode("div", [], {
    children: document.children.map((child, index) =>
      renderParagraphNode(child, [index]),
    ),
  });
}
