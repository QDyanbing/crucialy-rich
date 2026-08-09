import {
  getTextMarkAttribute,
  hasTextMark,
  type DocumentNode,
  type ParagraphNode,
  type TextNode,
} from "../model";
import type { Path } from "../selection";
import { createModelPathAttributes } from "./attributes";
import type { RenderedElementNode, RenderedElementStyle } from "./types";

function createRenderedNode(
  tagName: RenderedElementNode["tagName"],
  path: Path,
  options: Partial<
    Pick<RenderedElementNode, "attributes" | "children" | "style" | "text">
  > = {},
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
  const fontSize = getTextMarkAttribute(node.marks, "fontSize");
  const italic = hasTextMark(node.marks, "italic");
  const strike = hasTextMark(node.marks, "strike");
  const underline = hasTextMark(node.marks, "underline");
  const decorations = [
    underline ? "underline" : undefined,
    strike ? "line-through" : undefined,
  ].filter((decoration): decoration is string => decoration !== undefined);
  const needsDecorationStyle =
    decorations.length > 0 && (bold || italic || decorations.length > 1);
  const style: RenderedElementStyle = {
    ...(fontSize === undefined ? {} : { fontSize: `${fontSize}px` as const }),
    ...(bold && italic ? { fontStyle: "italic" } : {}),
    ...(needsDecorationStyle ? { textDecoration: decorations.join(" ") } : {}),
  };
  const options = {
    attributes: createModelPathAttributes(path),
    ...(Object.keys(style).length > 0 ? { style } : {}),
    text: node.text,
  };

  if (bold) {
    return createRenderedNode("strong", path, options);
  }

  const tagName = italic
    ? "em"
    : underline && !strike
      ? "u"
      : strike && !underline
        ? "s"
        : "span";

  return createRenderedNode(tagName, path, options);
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
