import { isTextNode, type DocumentNode } from "../model";
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

    return path ? createValidPoint(document, path, domPoint.offset) : undefined;
  }

  if (!isElementNode(domPoint.node)) {
    return undefined;
  }

  const path = getElementModelPath(domPoint.node);
  const modelNode = path ? getNodeAtPath(document, path) : undefined;

  if (!path || !isTextNode(modelNode)) {
    return undefined;
  }

  return createValidPoint(document, path, domPoint.offset);
}
