import {
  hasTextMark,
  type DocumentNode,
  type ParagraphNode,
  type TextNode,
} from "../model";
import type { Path } from "../selection";
import { createModelPathAttributes } from "./attributes";
import type { RenderedElementNode } from "./types";

function createRenderedNode(
  tagName: RenderedElementNode["tagName"],
  path: Path,
  options: Partial<Pick<RenderedElementNode, "attributes" | "children" | "text">> = {},
): RenderedElementNode {
  return {
    tagName,
    path,
    attributes: createModelPathAttributes(path),
    ...options,
  };
}

function renderTextNode(node: TextNode, path: Path): RenderedElementNode {
  const bold = hasTextMark(node.marks, "bold");
  const italic = hasTextMark(node.marks, "italic");

  if (bold) {
    return createRenderedNode("strong", path, {
      attributes: italic
        ? {
            ...createModelPathAttributes(path),
            style: "font-style: italic;",
          }
        : createModelPathAttributes(path),
      text: node.text,
    });
  }

  return createRenderedNode(italic ? "em" : "span", path, { text: node.text });
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
