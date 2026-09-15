import {
  getTextMarkAttribute,
  getLinkMark,
  hasTextMark,
  type BlockNode,
  type DocumentNode,
  type HeadingLevel,
  type ListNode,
  type TableNode,
  type TextNode,
} from "../model";
import type { Path } from "../selection";
import { createModelPathAttributes } from "./attributes";
import type {
  RenderedElementNode,
  RenderedElementStyle,
  RenderedTagName,
} from "./types";

const HEADING_TAG_NAMES = {
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
  5: "h5",
  6: "h6",
} as const satisfies Record<HeadingLevel, RenderedTagName>;

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
  const backgroundColor = getTextMarkAttribute(node.marks, "backgroundColor");
  const bold = hasTextMark(node.marks, "bold");
  const fontSize = getTextMarkAttribute(node.marks, "fontSize");
  const textColor = getTextMarkAttribute(node.marks, "textColor");
  const italic = hasTextMark(node.marks, "italic");
  const link = getLinkMark(node.marks);
  const strike = hasTextMark(node.marks, "strike");
  const underline = hasTextMark(node.marks, "underline");
  const decorations = [
    underline || link ? "underline" : undefined,
    strike ? "line-through" : undefined,
  ].filter((decoration): decoration is string => decoration !== undefined);
  const needsDecorationStyle =
    decorations.length > 0 &&
    (link !== undefined || bold || italic || decorations.length > 1);
  const style: RenderedElementStyle = {
    ...(backgroundColor === undefined ? {} : { backgroundColor }),
    ...(textColor === undefined ? {} : { color: textColor }),
    ...(fontSize === undefined ? {} : { fontSize: `${fontSize}px` as const }),
    ...(italic && (bold || link) ? { fontStyle: "italic" } : {}),
    ...(bold && link ? { fontWeight: "700" } : {}),
    ...(needsDecorationStyle ? { textDecoration: decorations.join(" ") } : {}),
  };
  const options = {
    attributes: {
      ...createModelPathAttributes(path),
      ...(link === undefined
        ? {}
        : {
            href: link.href,
            ...(link.rel === undefined ? {} : { rel: link.rel }),
            ...(link.target === undefined ? {} : { target: link.target }),
          }),
    },
    ...(Object.keys(style).length > 0 ? { style } : {}),
    text: node.text,
  };

  if (link) {
    return createRenderedNode("a", path, options);
  }

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

function renderCodeTextNode(node: TextNode, path: Path): RenderedElementNode {
  return createRenderedNode("code", path, { text: node.text });
}

function renderListNode(node: ListNode, path: Path): RenderedElementNode {
  return createRenderedNode(node.type === "orderedList" ? "ol" : "ul", path, {
    attributes: {
      ...createModelPathAttributes(path),
      ...(node.type === "taskList" ? { "data-crucialy-list-type": "task" } : {}),
    },
    children: node.children.map((item, itemIndex) => {
      const itemPath = [...path, itemIndex];
      const textChildren = item.children.map((child, textIndex) =>
        renderTextNode(child, [...itemPath, textIndex]),
      );
      const taskControl =
        item.type === "taskItem"
          ? createRenderedNode("input", itemPath, {
              attributes: {
                ...createModelPathAttributes(itemPath),
                "aria-label": item.checked ? "标记任务为未完成" : "标记任务为已完成",
                checked: item.checked,
                contentEditable: "false",
                "data-crucialy-task-item": "true",
                readOnly: true,
                type: "checkbox",
              },
            })
          : undefined;
      const content = taskControl ? [taskControl, ...textChildren] : textChildren;

      return createRenderedNode("li", itemPath, {
        attributes: {
          ...createModelPathAttributes(itemPath),
          ...(item.type === "taskItem" ? { "data-checked": String(item.checked) } : {}),
        },
        children: item.nested
          ? [
              ...content,
              renderListNode(item.nested, [...itemPath, item.children.length]),
            ]
          : content,
      });
    }),
  });
}

function renderTableNode(node: TableNode, path: Path): RenderedElementNode {
  return createRenderedNode("table", path, {
    attributes: {
      ...createModelPathAttributes(path),
      contentEditable: "false",
      "data-crucialy-table": "true",
    },
    children: [
      createRenderedNode("tbody", path, {
        children: node.children.map((row, rowIndex) => {
          const rowPath = [...path, rowIndex];

          return createRenderedNode("tr", rowPath, {
            children: row.children.map((cell, cellIndex) => {
              const cellPath = [...rowPath, cellIndex];

              return createRenderedNode("td", cellPath, {
                children: cell.children.map((paragraph, paragraphIndex) => {
                  const paragraphPath = [...cellPath, paragraphIndex];

                  return createRenderedNode("p", paragraphPath, {
                    children: paragraph.children.map((text, textIndex) =>
                      renderTextNode(text, [...paragraphPath, textIndex]),
                    ),
                  });
                }),
              });
            }),
          });
        }),
      }),
    ],
  });
}

function renderBlockNode(node: BlockNode, path: Path): RenderedElementNode {
  if (node.type === "image") {
    return createRenderedNode("img", path, {
      attributes: {
        ...createModelPathAttributes(path),
        alt: node.alt,
        contentEditable: "false",
        "data-crucialy-image": "true",
        "data-status": node.status,
        ...(node.height === null ? {} : { height: String(node.height) }),
        src: node.src,
        ...(node.width === null ? {} : { width: String(node.width) }),
      },
    });
  }

  if (node.type === "divider") {
    return createRenderedNode("hr", path);
  }

  if (node.type === "codeBlock") {
    return createRenderedNode("pre", path, {
      children: node.children.map((child, index) =>
        renderCodeTextNode(child, [...path, index]),
      ),
    });
  }

  if (node.type === "table") {
    return renderTableNode(node, path);
  }

  if (
    node.type === "bulletList" ||
    node.type === "orderedList" ||
    node.type === "taskList"
  ) {
    return renderListNode(node, path);
  }

  const tagName =
    node.type === "heading"
      ? HEADING_TAG_NAMES[node.level]
      : node.type === "quote"
        ? "blockquote"
        : "p";

  return createRenderedNode(tagName, path, {
    children: node.children.map((child, index) =>
      renderTextNode(child, [...path, index]),
    ),
  });
}

export function renderDocument(document: DocumentNode): RenderedElementNode {
  return createRenderedNode("div", [], {
    children: document.children.map((child, index) => renderBlockNode(child, [index])),
  });
}
