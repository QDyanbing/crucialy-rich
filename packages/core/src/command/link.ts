import {
  areLinkMarksEqual,
  getLinkMark,
  isTextBlockNode,
  normalizeLinkMark,
  type LinkMarkAttributes,
  type TextNode,
} from "../model";
import {
  applyTransaction,
  createSelectionAfterSetLink,
  createSetLinkOperation,
  createTransaction,
} from "../operation";
import { isCollapsed } from "../selection";
import { createCommandSkipped, createCommandSuccess } from "./result";
import {
  getTextMarkCommandRanges,
  restoreTextMarkCommandSelection,
  type TextMarkCommandRange,
} from "./text-mark-range";
import type { Command, CommandInput } from "./types";

export const SET_LINK_COMMAND_NAME = "setLink";
export const UNSET_LINK_COMMAND_NAME = "unsetLink";

export type SetLinkCommandPayload = LinkMarkAttributes;

interface LinkCommandTarget {
  ranges: TextMarkCommandRange[];
  textNodes: TextNode[];
}

function getSelectedTextNodes(
  input: CommandInput,
  ranges: TextMarkCommandRange[],
): TextNode[] {
  return ranges.flatMap((target) => {
    const block = input.context.document.children[target.blockIndex];

    if (!isTextBlockNode(block)) {
      return [];
    }

    const startTextIndex = target.range.anchor.path[1];
    const endTextIndex = target.range.focus.path[1];

    if (startTextIndex === undefined || endTextIndex === undefined) {
      return [];
    }

    if (isCollapsed(target.range)) {
      const textNode = block.children[startTextIndex];

      return textNode ? [textNode] : [];
    }

    return block.children
      .slice(startTextIndex, endTextIndex + 1)
      .filter((node, index) => {
        const textIndex = startTextIndex + index;
        const selectionStart =
          textIndex === startTextIndex ? target.range.anchor.offset : 0;
        const selectionEnd =
          textIndex === endTextIndex ? target.range.focus.offset : node.text.length;

        return selectionStart < selectionEnd;
      });
  });
}

function getLinkSelectionTarget(
  input: CommandInput,
  includeCollapsed: boolean,
): LinkCommandTarget | undefined {
  const selection = input.context.selection;

  if (!selection) {
    return undefined;
  }

  const ranges = getTextMarkCommandRanges(input.context.document, selection);

  if (!ranges || (!includeCollapsed && isCollapsed(selection))) {
    return undefined;
  }

  const textNodes = getSelectedTextNodes(input, ranges);

  return textNodes.length > 0 ? { ranges, textNodes } : undefined;
}

function getLinkCommandTarget(input: CommandInput): LinkCommandTarget | undefined {
  return getLinkSelectionTarget(input, false);
}

function resolveLink(input: CommandInput): LinkMarkAttributes | undefined {
  return normalizeLinkMark(input.payload);
}

export function canExecuteSetLinkCommand(input: CommandInput): boolean {
  return getLinkCommandTarget(input) !== undefined && resolveLink(input) !== undefined;
}

export function canExecuteUnsetLinkCommand(input: CommandInput): boolean {
  return (
    getLinkCommandTarget(input)?.textNodes.some(
      (textNode) => getLinkMark(textNode.marks) !== undefined,
    ) ?? false
  );
}

export function getSelectedLinkMark(
  input: CommandInput,
): LinkMarkAttributes | undefined {
  const target = getLinkSelectionTarget(input, true);
  const firstLink = getLinkMark(target?.textNodes[0]?.marks);

  if (!target || !firstLink) {
    return undefined;
  }

  return target.textNodes.every((textNode) =>
    areLinkMarksEqual(getLinkMark(textNode.marks), firstLink),
  )
    ? firstLink
    : undefined;
}

export function isLinkCommandActive(input: CommandInput): boolean {
  return (
    getLinkCommandTarget(input) !== undefined &&
    getSelectedLinkMark(input) !== undefined
  );
}

function createLinkCommandResult(
  input: CommandInput,
  commandName: string,
  link: LinkMarkAttributes | null,
) {
  const target = getLinkCommandTarget(input);

  if (!target) {
    return createCommandSkipped(
      commandName,
      `${commandName} command requires a non-collapsed text selection.`,
    );
  }

  const operations = target.ranges.map(({ range }) =>
    createSetLinkOperation(range, link),
  );
  const transaction = createTransaction(operations);
  const selection = input.context.selection!;
  const nextSelection =
    selection.anchor.path[0] === selection.focus.path[0]
      ? createSelectionAfterSetLink(input.context.document, operations[0]!)
      : restoreTextMarkCommandSelection(
          input.context.document,
          selection,
          applyTransaction(input.context.document, transaction),
        );

  if (!nextSelection) {
    return createCommandSkipped(
      commandName,
      `${commandName} command could not restore the text selection.`,
    );
  }

  return createCommandSuccess(commandName, {
    selection: nextSelection,
    transaction,
  });
}

export const setLinkCommand: Command = {
  canExecute: canExecuteSetLinkCommand,
  execute(input) {
    const link = resolveLink(input);

    if (!link || !getLinkCommandTarget(input)) {
      return createCommandSkipped(
        SET_LINK_COMMAND_NAME,
        "Set link command requires a safe link and non-collapsed text selection.",
      );
    }

    return createLinkCommandResult(input, SET_LINK_COMMAND_NAME, link);
  },
  isActive: isLinkCommandActive,
  name: SET_LINK_COMMAND_NAME,
};

export const unsetLinkCommand: Command = {
  canExecute: canExecuteUnsetLinkCommand,
  execute(input) {
    if (!canExecuteUnsetLinkCommand(input)) {
      return createCommandSkipped(
        UNSET_LINK_COMMAND_NAME,
        "Unset link command requires linked text in a non-collapsed selection.",
      );
    }

    return createLinkCommandResult(input, UNSET_LINK_COMMAND_NAME, null);
  },
  isActive: isLinkCommandActive,
  name: UNSET_LINK_COMMAND_NAME,
};

export const LINK_COMMANDS: readonly Command[] = [setLinkCommand, unsetLinkCommand];
