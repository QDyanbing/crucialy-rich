import {
  isListEntryNode,
  isListNode,
  isTextBlockNode,
  isTextNode,
  type DocumentNode,
} from "../model";
import { getNodeAtPath, isValidPoint, type Path, type Point } from "../selection";
import { decodeModelPath, encodeModelPath, MODEL_PATH_ATTRIBUTE } from "./attributes";

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

export interface DomPoint {
  node: Node;
  offset: number;
}

function isElementNode(node: Node): node is Element {
  return node.nodeType === ELEMENT_NODE;
}

function isTextDomNode(node: Node): node is Text {
  return node.nodeType === TEXT_NODE;
}

function getTextChildren(element: Element): Text[] | undefined {
  if (["INPUT", "IMG", "HR", "BR"].includes(element.tagName)) return undefined;
  const children = Array.from(element.childNodes);
  return children.every(isTextDomNode) ? children : undefined;
}

function isDomOffset(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

function createValidPoint(
  document: DocumentNode,
  path: Path,
  offset: number,
): Point | undefined {
  const point = { path, offset };

  return isValidPoint(document, point) ? point : undefined;
}

function createBlockBoundaryPoint(
  document: DocumentNode,
  element: Element,
  path: Path,
  offset: number,
): Point | undefined {
  const node = getNodeAtPath(document, path);

  if (
    (!isTextBlockNode(node) && !isListEntryNode(node)) ||
    node.children.length === 0
  ) {
    return undefined;
  }

  const children = Array.from(element.childNodes);
  function childPoint(child: Node, atEnd: boolean): Point | undefined {
    if (!isElementNode(child)) return undefined;
    const childPath = getElementModelPath(child);
    const text = childPath ? getNodeAtPath(document, childPath) : undefined;
    const texts = getTextChildren(child);
    return childPath &&
      childPath.length === path.length + 1 &&
      path.every((part, index) => part === childPath[index]) &&
      isTextNode(text) &&
      texts
      ? createValidPoint(
          document,
          childPath,
          atEnd ? texts.reduce((length, child) => length + child.data.length, 0) : 0,
        )
      : undefined;
  }
  function ignorable(child: Node): boolean {
    if (child.nodeType === 8 || (isTextDomNode(child) && child.data.trim() === ""))
      return true;
    return (
      isListEntryNode(node) &&
      node.type === "taskItem" &&
      isElementNode(child) &&
      child.tagName === "INPUT" &&
      child.getAttribute("data-crucialy-task-item") === "true" &&
      child.getAttribute("data-crucialy-path") === encodeModelPath(path)
    );
  }
  for (let index = offset; index < children.length; index++) {
    const child = children[index]!;
    if (ignorable(child)) continue;
    const point = childPoint(child, false);
    if (point) return point;
    const childPath = isElementNode(child) ? getElementModelPath(child) : undefined;
    if (
      isListEntryNode(node) &&
      childPath &&
      childPath.length === path.length + 1 &&
      path.every((part, i) => part === childPath[i]) &&
      isListNode(getNodeAtPath(document, childPath))
    )
      break;
    return undefined;
  }
  for (let index = offset - 1; index >= 0; index--) {
    const child = children[index]!;
    if (ignorable(child)) continue;
    return childPoint(child, true);
  }
  return undefined;
}

export function getElementModelPath(element: Element): Path | undefined {
  const value = element.getAttribute(MODEL_PATH_ATTRIBUTE);

  return value ? decodeModelPath(value) : undefined;
}

export function findClosestModelPathElement(node: Node): Element | undefined {
  let current: Element | null = isElementNode(node) ? node : node.parentElement;

  while (current) {
    if (getElementModelPath(current)) {
      return current;
    }

    current = current.parentElement;
  }

  return undefined;
}

export function findElementByModelPath(
  root: ParentNode,
  path: Path,
): Element | undefined {
  const encodedPath = encodeModelPath(path);

  if (
    isElementNode(root as Node) &&
    (root as Element).getAttribute(MODEL_PATH_ATTRIBUTE) === encodedPath
  ) {
    return root as Element;
  }

  return Array.from(root.querySelectorAll(`[${MODEL_PATH_ATTRIBUTE}]`)).find(
    (element) => element.getAttribute(MODEL_PATH_ATTRIBUTE) === encodedPath,
  );
}

export function domPointToModelPoint(
  document: DocumentNode,
  domPoint: DomPoint,
): Point | undefined {
  if (!isDomOffset(domPoint.offset)) {
    return undefined;
  }

  if (isTextDomNode(domPoint.node)) {
    const element = findClosestModelPathElement(domPoint.node);
    const path = element ? getElementModelPath(element) : undefined;
    const texts = element ? getTextChildren(element) : undefined;
    const index = texts?.indexOf(domPoint.node);
    if (
      !path ||
      !texts ||
      index === undefined ||
      index < 0 ||
      domPoint.offset > domPoint.node.data.length
    ) {
      return undefined;
    }
    const prefix = texts
      .slice(0, index)
      .reduce((length, text) => length + text.data.length, 0);
    return createValidPoint(document, path, prefix + domPoint.offset);
  }

  if (!isElementNode(domPoint.node)) {
    return undefined;
  }
  if (
    domPoint.offset > domPoint.node.childNodes.length ||
    ["INPUT", "IMG", "HR", "BR"].includes(domPoint.node.tagName)
  )
    return undefined;

  const path = getElementModelPath(domPoint.node);
  const modelNode = path ? getNodeAtPath(document, path) : undefined;

  if (!path) {
    return undefined;
  }

  if (isTextNode(modelNode)) {
    const children = getTextChildren(domPoint.node);
    if (!children || domPoint.offset > children.length) {
      return undefined;
    }
    const offset = children
      .slice(0, domPoint.offset)
      .reduce((length, text) => length + text.data.length, 0);
    return createValidPoint(document, path, offset);
  }

  return createBlockBoundaryPoint(document, domPoint.node, path, domPoint.offset);
}

export function modelPointToDomPoint(
  root: ParentNode,
  document: DocumentNode,
  point: Point,
): DomPoint | undefined {
  if (!isValidPoint(document, point)) {
    return undefined;
  }

  const element = findElementByModelPath(root, point.path);
  const texts = element ? getTextChildren(element) : undefined;
  if (!element || !texts) return undefined;
  let offset = point.offset;
  for (const text of texts) {
    if (offset <= text.data.length) return { node: text, offset };
    offset -= text.data.length;
  }

  return texts.length === 0 && offset === 0
    ? {
        node: element,
        offset: 0,
      }
    : undefined;
}
