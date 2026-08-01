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
  const underline = hasTextMark(node.marks, "underline");
  const styles = [
    bold && italic ? "font-style: italic;" : undefined,
    underline && (bold || italic) ? "text-decoration: underline;" : undefined,
  ].filter((style): style is string => style !== undefined);
  const attributes =
    styles.length > 0
      ? {
          ...createModelPathAttributes(path),
          style: styles.join(" "),
        }
      : createModelPathAttributes(path);

  if (bold) {
    return createRenderedNode("strong", path, {
      attributes,
      text: node.text,
    });
  }

  return createRenderedNode(italic ? "em" : underline ? "u" : "span", path, {
    attributes,
    text: node.text,
  });
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
