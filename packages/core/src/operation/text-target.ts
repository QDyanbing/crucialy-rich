import {
  isListEntryNode,
  isTextBlockNode,
  type DocumentNode,
  type ListEntryNode,
  type TextBlockNode,
} from "../model";
import { getNodeAtPath, type Path, type Point } from "../selection";
import { updateListAtPath } from "./list-item-path";

export type TextContainerNode = ListEntryNode | TextBlockNode;

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
    (!isTextBlockNode(container) && !isListEntryNode(container)) ||
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
  const [blockIndex] = path;

  if (path.length === 1 && blockIndex !== undefined) {
    return {
      ...document,
      children: document.children.map((block, index) =>
        index === blockIndex && isTextBlockNode(container) ? container : block,
      ),
    };
  }

  const itemIndex = path.at(-1);

  if (itemIndex === undefined || !isListEntryNode(container)) {
    throw new RangeError(
      "text container path must reference a text block or list item",
    );
  }

  return updateListAtPath(document, path.slice(0, -1), (list) => ({
    ...list,
    children: list.children.map((item, currentItemIndex) =>
      currentItemIndex === itemIndex ? container : item,
    ),
  }));
}
