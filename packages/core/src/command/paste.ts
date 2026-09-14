import { isParagraphNode } from "../model";
import {
  createDeleteTextOperation,
  createInsertTextOperation,
  createSelectionAfterInsertText,
  createSplitBlockOperation,
  createTransaction,
  type Operation,
} from "../operation";
import {
  isCollapsed,
  isValidPoint,
  normalizeRange,
  type Path,
  type RangeSelection,
} from "../selection";
import type { ClipboardFragment } from "../clipboard";
import { createCommandSkipped, createCommandSuccess } from "./result";
import type { Command, CommandInput } from "./types";

export const PASTE_COMMAND_NAME = "paste";

export interface PasteCommandPayload {
  fragment: ClipboardFragment;
}

function isSamePath(left: Path, right: Path): boolean {
  return (
    left.length === right.length && left.every((part, index) => part === right[index])
  );
}

function resolvePasteTarget(
  input: CommandInput,
): { lines: string[]; range: RangeSelection } | undefined {
  const selection = input.context.selection;
  const payload = input.payload;

  if (
    !selection ||
    !isValidPoint(input.context.document, selection.anchor) ||
    !isValidPoint(input.context.document, selection.focus) ||
    typeof payload !== "object" ||
    payload === null ||
    !("fragment" in payload) ||
    typeof payload.fragment !== "object" ||
    payload.fragment === null ||
    !("blocks" in payload.fragment) ||
    !("mimeType" in payload.fragment) ||
    !Array.isArray(payload.fragment.blocks) ||
    payload.fragment.blocks.length === 0 ||
    payload.fragment.mimeType !== "text/plain"
  ) {
    return undefined;
  }

  const range = normalizeRange(selection);

  if (
    range.anchor.path.length !== 2 ||
    !isSamePath(range.anchor.path, range.focus.path) ||
    !payload.fragment.blocks.every(isParagraphNode)
  ) {
    return undefined;
  }

  return {
    lines: payload.fragment.blocks.map((block) =>
      block.children.map((node) => node.text).join(""),
    ),
    range,
  };
}

export function canExecutePasteCommand(input: CommandInput): boolean {
  return resolvePasteTarget(input) !== undefined;
}

export const pasteCommand: Command = {
  canExecute: canExecutePasteCommand,
  execute(input) {
    const target = resolvePasteTarget(input);

    if (!target) {
      return createCommandSkipped(
        PASTE_COMMAND_NAME,
        "Paste command requires a supported fragment and editable text selection.",
      );
    }

    const operations: Operation[] = isCollapsed(target.range)
      ? []
      : [createDeleteTextOperation(target.range)];
    let point = {
      offset: target.range.anchor.offset,
      path: [...target.range.anchor.path],
    };

    target.lines.forEach((line, index) => {
      const insertOperation = createInsertTextOperation(point, line);

      operations.push(insertOperation);
      point = createSelectionAfterInsertText(insertOperation).anchor;

      if (index < target.lines.length - 1) {
        const [blockIndex] = point.path;

        operations.push(createSplitBlockOperation(point));
        point = {
          offset: 0,
          path: [(blockIndex ?? 0) + 1, 0],
        };
      }
    });

    return createCommandSuccess(PASTE_COMMAND_NAME, {
      selection: {
        anchor: point,
        focus: { offset: point.offset, path: [...point.path] },
      },
      transaction: createTransaction(operations),
    });
  },
  name: PASTE_COMMAND_NAME,
};
