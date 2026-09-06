import { isTaskItemNode, type DocumentNode } from "../model";
import { getNodeAtPath, type Path } from "../selection";
import { updateListAtPath } from "./list-item-path";
import type { SetTaskItemCheckedOperation } from "./types";

export function createSetTaskItemCheckedOperation(
  path: Path,
  checked: boolean,
): SetTaskItemCheckedOperation {
  return { checked, path: [...path], type: "set_task_item_checked" };
}

export function applySetTaskItemChecked(
  document: DocumentNode,
  operation: SetTaskItemCheckedOperation,
): DocumentNode {
  const item = getNodeAtPath(document, operation.path);
  const itemIndex = operation.path.at(-1);
  const listPath = operation.path.slice(0, -1);

  if (!isTaskItemNode(item) || itemIndex === undefined) {
    throw new RangeError("task item checked path must reference a task item");
  }

  return updateListAtPath(document, listPath, (list) => ({
    ...list,
    children: list.children.map((entry, index) =>
      index === itemIndex ? { ...item, checked: operation.checked } : entry,
    ),
  }));
}
