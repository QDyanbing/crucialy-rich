import {
  isListItemNode,
  isListNode,
  isTextBlockNode,
  type DocumentNode,
  type ListItemNode,
  type TextBlockNode,
} from "../model";
import { getNodeAtPath, type Path, type Point } from "../selection";

export type TextContainerNode = ListItemNode | TextBlockNode;

export interface TextTarget {
  container: TextContainerNode;
  containerPath: Path;
  textIndex: number;
}

export function getTextTarget(
  document: DocumentNode,
  point: Point,
): TextTarget | undefined {
  const textIndex = point.path.at(-1);
  const containerPath = point.path.slice(0, -1);
  const container = getNodeAtPath(document, containerPath);

  if (
    textIndex === undefined ||
    (!isTextBlockNode(container) && !isListItemNode(container)) ||
    container.children[textIndex] === undefined
  ) {
    return undefined;
  }

  return { container, containerPath, textIndex };
}

export function replaceTextContainer(
  document: DocumentNode,
  path: Path,
  container: TextContainerNode,
): DocumentNode {
  const [blockIndex, itemIndex] = path;

  if (path.length === 1 && blockIndex !== undefined) {
    return {
      ...document,
      children: document.children.map((block, index) =>
        index === blockIndex && isTextBlockNode(container) ? container : block,
      ),
    };
  }

  const list = blockIndex === undefined ? undefined : document.children[blockIndex];

  if (
    path.length !== 2 ||
    itemIndex === undefined ||
    !isListNode(list) ||
    !isListItemNode(container)
  ) {
    throw new RangeError(
      "text container path must reference a text block or list item",
    );
  }

  return {
    ...document,
    children: document.children.map((block, index) =>
      index === blockIndex
        ? {
            ...list,
            children: list.children.map((item, currentItemIndex) =>
              currentItemIndex === itemIndex ? container : item,
            ),
          }
        : block,
    ),
  };
}
