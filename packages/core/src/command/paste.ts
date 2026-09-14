import { isParagraphNode } from "../model";
import {
  createDeleteTextOperation,
  createInsertTextOperation,
  createSelectionAfterInsertText,
  createTransaction,
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
): { range: RangeSelection; text: string } | undefined {
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
    !Array.isArray(payload.fragment.blocks) ||
    payload.fragment.blocks.length !== 1
  ) {
    return undefined;
  }

  const range = normalizeRange(selection);
  const [block] = payload.fragment.blocks;

  if (!isSamePath(range.anchor.path, range.focus.path) || !isParagraphNode(block)) {
    return undefined;
  }

  return {
    range,
    text: block.children.map((node) => node.text).join(""),
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

    const insertOperation = createInsertTextOperation(target.range.anchor, target.text);
    const operations = isCollapsed(target.range)
      ? [insertOperation]
      : [createDeleteTextOperation(target.range), insertOperation];

    return createCommandSuccess(PASTE_COMMAND_NAME, {
      selection: createSelectionAfterInsertText(insertOperation),
      transaction: createTransaction(operations),
    });
  },
  name: PASTE_COMMAND_NAME,
};
