import {
  isListEntryNode,
  isParagraphNode,
  isTableNode,
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

  if (path.length === 4 && blockIndex !== undefined && isParagraphNode(container)) {
    const [, rowIndex, cellIndex, paragraphIndex] = path;
    const table = document.children[blockIndex];
    const row =
      rowIndex === undefined || !isTableNode(table)
        ? undefined
        : table.children[rowIndex];
    const cell = cellIndex === undefined ? undefined : row?.children[cellIndex];

    if (
      isTableNode(table) &&
      row &&
      cell &&
      paragraphIndex !== undefined &&
      cell.children[paragraphIndex]
    ) {
      const nextTable = {
        ...table,
        children: table.children.map((currentRow, currentRowIndex) =>
          currentRowIndex === rowIndex
            ? {
                ...currentRow,
                children: currentRow.children.map((currentCell, currentCellIndex) =>
                  currentCellIndex === cellIndex
                    ? {
                        ...currentCell,
                        children: currentCell.children.map(
                          (paragraph, currentParagraphIndex) =>
                            currentParagraphIndex === paragraphIndex
                              ? container
                              : paragraph,
                        ),
                      }
                    : currentCell,
                ),
              }
            : currentRow,
        ),
      };

      return {
        ...document,
        children: document.children.map((block, currentBlockIndex) =>
          currentBlockIndex === blockIndex ? nextTable : block,
        ),
      };
    }
  }

  const itemIndex = path.at(-1);

  if (itemIndex === undefined || !isListEntryNode(container)) {
    throw new RangeError(
      "text container path must reference a text block, list item, or table paragraph",
    );
  }

  return updateListAtPath(document, path.slice(0, -1), (list) => ({
    ...list,
    children: list.children.map((item, currentItemIndex) =>
      currentItemIndex === itemIndex ? container : item,
    ),
  }));
}
