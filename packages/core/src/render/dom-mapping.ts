import type { Path } from "../selection";
import { decodeModelPath, encodeModelPath, MODEL_PATH_ATTRIBUTE } from "./attributes";

const ELEMENT_NODE = 1;

function isElementNode(node: Node): node is Element {
  return node.nodeType === ELEMENT_NODE;
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
