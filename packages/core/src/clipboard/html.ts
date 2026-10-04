import { parseFragment, type DefaultTreeAdapterMap } from "parse5";

import {
  createBulletList,
  createCodeBlock,
  createHeading,
  createImage,
  createListItem,
  createOrderedList,
  createParagraph,
  createQuote,
  createTableCell,
  createTableRow,
  createTaskItem,
  createTaskList,
  createText,
  isValidFontSize,
  MAX_LIST_DEPTH,
  normalizeImageDimension,
  normalizeLinkMark,
  sanitizeHexColor,
  sanitizeImageSrc,
  type BlockNode,
  type HeadingLevel,
  type ListNode,
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

function hasAttribute(node: HtmlElement, name: string): boolean {
  return node.attrs.some((attribute) => attribute.name === name);
}

function parseInlineStyleDeclarations(value: string | undefined): Map<string, string> {
  const declarations = new Map<string, string>();

  value?.split(";").forEach((declaration) => {
    const separator = declaration.indexOf(":");

    if (separator === -1) {
      return;
    }

    const property = declaration.slice(0, separator).trim().toLowerCase();
    const propertyValue = declaration.slice(separator + 1).trim();

    if (property.length > 0 && propertyValue.length > 0) {
      declarations.set(property, propertyValue);
    }
  });

  return declarations;
}

function parseInlineStyleMarks(node: HtmlElement): TextMarks {
  const declarations = parseInlineStyleDeclarations(getAttribute(node, "style"));
  const marks: TextMarks = {};
  const fontSizeValue = declarations.get("font-size")?.match(/^(\d+)px$/i)?.[1];
  const fontSize = fontSizeValue === undefined ? undefined : Number(fontSizeValue);

  if (isValidFontSize(fontSize)) {
    marks.fontSize = fontSize;
  }

  const textColor = sanitizeHexColor(declarations.get("color"));

  if (textColor !== undefined) {
    marks.textColor = textColor;
  }

  const backgroundColor = sanitizeHexColor(declarations.get("background-color"));

  if (backgroundColor !== undefined) {
    marks.backgroundColor = backgroundColor;
  }

  return marks;
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

  let nextMarks = { ...marks, ...parseInlineStyleMarks(node) };

  if (node.tagName === "strong" || node.tagName === "b") {
    nextMarks = { ...nextMarks, bold: true };
  } else if (node.tagName === "em" || node.tagName === "i") {
    nextMarks = { ...nextMarks, italic: true };
  } else if (node.tagName === "u") {
    nextMarks = { ...nextMarks, underline: true };
  } else if (
    node.tagName === "s" ||
    node.tagName === "strike" ||
    node.tagName === "del"
  ) {
    nextMarks = { ...nextMarks, strike: true };
  } else if (node.tagName === "a") {
    const link = normalizeLinkMark({
      href: getAttribute(node, "href"),
      rel: getAttribute(node, "rel"),
      target: getAttribute(node, "target"),
    });

    nextMarks = link ? { ...nextMarks, link } : nextMarks;
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

const TASK_CHECKBOX_WRAPPERS = new Set(["div", "label", "p", "span"]);

function findLeadingTaskCheckbox(node: HtmlElement): HtmlElement | undefined {
  const child = node.childNodes.find(
    (candidate) => !isText(candidate) || candidate.value.trim().length > 0,
  );

  if (!child || !isElement(child)) {
    return undefined;
  }

  if (
    child.tagName === "input" &&
    getAttribute(child, "type")?.toLowerCase() === "checkbox"
  ) {
    return child;
  }

  return TASK_CHECKBOX_WRAPPERS.has(child.tagName)
    ? findLeadingTaskCheckbox(child)
    : undefined;
}

function parseNestedList(node: HtmlElement, depth: number): ListNode | undefined {
  if (depth >= MAX_LIST_DEPTH) {
    return undefined;
  }

  const nested = node.childNodes.find(
    (child): child is HtmlElement =>
      isElement(child) && (child.tagName === "ul" || child.tagName === "ol"),
  );

  return nested ? parseList(nested, depth + 1) : undefined;
}

function parseOrderedListStart(node: HtmlElement): number | undefined {
  const value = getAttribute(node, "start")?.trim();

  if (!value || !/^[+-]?\d+$/.test(value)) {
    return undefined;
  }

  const start = Number(value);

  return Number.isSafeInteger(start) ? start : undefined;
}

function parseList(node: HtmlElement, depth = 1): ListNode {
  const itemNodes = node.childNodes.filter(
    (child): child is HtmlElement => isElement(child) && child.tagName === "li",
  );
  const taskCheckboxes = itemNodes.map(findLeadingTaskCheckbox);

  if (
    node.tagName === "ul" &&
    itemNodes.length > 0 &&
    taskCheckboxes.every((checkbox) => checkbox !== undefined)
  ) {
    return createTaskList(
      itemNodes.map((item, index) =>
        createTaskItem(
          parseInlineChildren(item, true),
          taskCheckboxes[index]
            ? hasAttribute(taskCheckboxes[index], "checked")
            : false,
          parseNestedList(item, depth),
        ),
      ),
    );
  }

  const items = itemNodes.map((item) =>
    createListItem(parseInlineChildren(item, true), parseNestedList(item, depth)),
  );

  return node.tagName === "ol"
    ? createOrderedList(
        items.length > 0 ? items : undefined,
        parseOrderedListStart(node),
      )
    : createBulletList(items.length > 0 ? items : undefined);
}

function parseImageDimension(value: string | undefined): number | null {
  const normalized = value?.trim();

  return normalized && /^\d+$/.test(normalized)
    ? normalizeImageDimension(Number(normalized))
    : null;
}

function parseImage(node: HtmlElement): BlockNode | undefined {
  const src = sanitizeImageSrc(getAttribute(node, "src"));

  return src
    ? createImage(src, {
        alt: getAttribute(node, "alt") ?? "",
        height: parseImageDimension(getAttribute(node, "height")),
        width: parseImageDimension(getAttribute(node, "width")),
      })
    : undefined;
}

function getStandaloneParagraphImage(node: HtmlElement): HtmlElement | undefined {
  const content = node.childNodes.filter(
    (child) => !isText(child) || child.value.trim().length > 0,
  );
  const child = content[0];

  return content.length === 1 && child && isElement(child) && child.tagName === "img"
    ? child
    : undefined;
}

function parseTableCell(node: HtmlElement) {
  const paragraphs = node.childNodes
    .filter((child): child is HtmlElement => isElement(child) && child.tagName === "p")
    .map((paragraph) => createParagraph(parseInlineChildren(paragraph)));

  return createTableCell(
    paragraphs.length > 0 ? paragraphs : [createParagraph(parseInlineChildren(node))],
  );
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
        .map(parseTableCell),
    )
    .filter((cells) => cells.length > 0);
  const columnCount = rows.reduce((count, cells) => Math.max(count, cells.length), 0);

  return columnCount > 0
    ? {
        children: rows.map((cells) =>
          createTableRow([
            ...cells,
            ...Array.from({ length: columnCount - cells.length }, () =>
              createTableCell(),
            ),
          ]),
        ),
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
    const imageNode = getStandaloneParagraphImage(node);

    if (imageNode) {
      const image = parseImage(imageNode);

      return image ? [image] : [];
    }

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

  if (node.tagName === "img") {
    const image = parseImage(node);

    return image ? [image] : [];
  }

  if (node.tagName === "ul" || node.tagName === "ol") {
    return [parseList(node)];
  }

  if (node.tagName === "table") {
    const table = parseTable(node);

    return table ? [table] : [];
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
