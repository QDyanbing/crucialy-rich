import { parseFragment, type DefaultTreeAdapterMap } from "parse5";

import {
  createBulletList,
  createCodeBlock,
  createHeading,
  createListItem,
  createOrderedList,
  createParagraph,
  createQuote,
  createTableCell,
  createTableRow,
  createText,
  normalizeLinkMark,
  type BlockNode,
  type HeadingLevel,
  type TableNode,
  type TextMarks,
  type TextNode,
} from "../model";
import type { ClipboardFragment, ClipboardParser } from "./types";

type HtmlNode = DefaultTreeAdapterMap["childNode"];
type HtmlElement = DefaultTreeAdapterMap["element"];
type HtmlText = DefaultTreeAdapterMap["textNode"];

function isElement(node: HtmlNode): node is HtmlElement {
  return "tagName" in node;
}

function isText(node: HtmlNode): node is HtmlText {
  return node.nodeName === "#text" && "value" in node;
}

function getTextContent(node: HtmlNode): string {
  if (isText(node)) {
    return node.value;
  }

  return "childNodes" in node ? node.childNodes.map(getTextContent).join("") : "";
}

function getAttribute(node: HtmlElement, name: string): string | undefined {
  return node.attrs.find((attribute) => attribute.name === name)?.value;
}

function appendInlineNodes(node: HtmlNode, marks: TextMarks, output: TextNode[]): void {
  if (isText(node)) {
    if (node.value.length > 0) {
      output.push(createText(node.value, marks));
    }
    return;
  }

  if (!isElement(node) || node.tagName === "script" || node.tagName === "style") {
    return;
  }

  if (node.tagName === "br") {
    output.push(createText("\n", marks));
    return;
  }

  let nextMarks = marks;

  if (node.tagName === "strong") {
    nextMarks = { ...marks, bold: true };
  } else if (node.tagName === "em") {
    nextMarks = { ...marks, italic: true };
  } else if (node.tagName === "a") {
    const link = normalizeLinkMark({ href: getAttribute(node, "href") });

    nextMarks = link ? { ...marks, link } : marks;
  }

  node.childNodes.forEach((child) => appendInlineNodes(child, nextMarks, output));
}

function parseInlineChildren(
  node: HtmlElement,
  excludeNestedLists = false,
): TextNode[] {
  const output: TextNode[] = [];

  node.childNodes.forEach((child) => {
    if (
      excludeNestedLists &&
      isElement(child) &&
      (child.tagName === "ul" || child.tagName === "ol")
    ) {
      return;
    }

    appendInlineNodes(child, {}, output);
  });

  return output.length > 0 ? output : [createText()];
}

function parseList(node: HtmlElement): BlockNode {
  const items = node.childNodes
    .filter((child): child is HtmlElement => isElement(child) && child.tagName === "li")
    .map((item) => createListItem(parseInlineChildren(item, true)));

  return node.tagName === "ol"
    ? createOrderedList(items.length > 0 ? items : undefined)
    : createBulletList(items.length > 0 ? items : undefined);
}

function parseTable(node: HtmlElement): TableNode | undefined {
  const rowNodes = node.childNodes.flatMap((child) => {
    if (!isElement(child)) {
      return [];
    }

    if (child.tagName === "tr") {
      return [child];
    }

    return child.tagName === "thead" ||
      child.tagName === "tbody" ||
      child.tagName === "tfoot"
      ? child.childNodes.filter(
          (row): row is HtmlElement => isElement(row) && row.tagName === "tr",
        )
      : [];
  });
  const rows = rowNodes
    .map((row) =>
      row.childNodes
        .filter(
          (child): child is HtmlElement =>
            isElement(child) && (child.tagName === "td" || child.tagName === "th"),
        )
        .map((cell) => createTableCell([createParagraph(parseInlineChildren(cell))])),
    )
    .filter((cells) => cells.length > 0);
  const columnCount = rows[0]?.length;

  return columnCount !== undefined &&
    rows.every((cells) => cells.length === columnCount)
    ? {
        children: rows.map((cells) => createTableRow(cells)),
        type: "table",
      }
    : undefined;
}

function parseBlock(node: HtmlNode): BlockNode[] {
  if (isText(node)) {
    return node.value.trim().length > 0
      ? [createParagraph([createText(node.value)])]
      : [];
  }

  if (!isElement(node) || node.tagName === "script" || node.tagName === "style") {
    return [];
  }

  if (node.tagName === "p") {
    return [createParagraph(parseInlineChildren(node))];
  }

  if (/^h[1-6]$/.test(node.tagName)) {
    return [
      createHeading(
        Number(node.tagName.slice(1)) as HeadingLevel,
        parseInlineChildren(node),
      ),
    ];
  }

  if (node.tagName === "blockquote") {
    return [createQuote(parseInlineChildren(node))];
  }

  if (node.tagName === "pre") {
    return [createCodeBlock([createText(getTextContent(node))])];
  }

  if (node.tagName === "ul" || node.tagName === "ol") {
    return [parseList(node)];
  }

  if (node.tagName === "table") {
    const table = parseTable(node);

    if (table) {
      return [table];
    }
  }

  const nestedBlocks = node.childNodes.flatMap(parseBlock);

  return nestedBlocks.length > 0
    ? nestedBlocks
    : getTextContent(node).trim().length > 0
      ? [createParagraph(parseInlineChildren(node))]
      : [];
}

export function parseHtml(value: string): ClipboardFragment | undefined {
  const blocks = parseFragment(value).childNodes.flatMap(parseBlock);

  return blocks.length > 0 ? { blocks, mimeType: "text/html" } : undefined;
}

export const htmlClipboardParser: ClipboardParser = {
  mimeType: "text/html",
  parse: parseHtml,
};
