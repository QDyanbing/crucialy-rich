import {
  areLinkMarksEqual,
  getLinkMark,
  isTextBlockNode,
  normalizeLinkMark,
  type LinkMarkAttributes,
  type TextNode,
} from "../model";
import {
  createSelectionAfterSetLink,
  createSetLinkOperation,
  createTransaction,
} from "../operation";
import {
  isCollapsed,
  isValidPoint,
  normalizeRange,
  type RangeSelection,
} from "../selection";
import { createCommandSkipped, createCommandSuccess } from "./result";
import type { Command, CommandInput } from "./types";

export const SET_LINK_COMMAND_NAME = "setLink";
export const UNSET_LINK_COMMAND_NAME = "unsetLink";

export type SetLinkCommandPayload = LinkMarkAttributes;

interface LinkCommandTarget {
  range: RangeSelection;
  textNodes: TextNode[];
}

function getLinkSelectionTarget(
  input: CommandInput,
  includeCollapsed: boolean,
): LinkCommandTarget | undefined {
  const selection = input.context.selection;

  if (!selection) {
    return undefined;
  }

  const range = normalizeRange(selection);

  if (
    (!includeCollapsed && isCollapsed(range)) ||
    !isValidPoint(input.context.document, range.anchor) ||
    !isValidPoint(input.context.document, range.focus)
  ) {
    return undefined;
  }

  const [anchorBlockIndex, anchorTextIndex] = range.anchor.path;
  const [focusBlockIndex, focusTextIndex] = range.focus.path;

  if (
    anchorBlockIndex === undefined ||
    anchorTextIndex === undefined ||
    focusBlockIndex === undefined ||
    focusTextIndex === undefined ||
    anchorBlockIndex !== focusBlockIndex
  ) {
    return undefined;
  }

  const block = input.context.document.children[anchorBlockIndex];

  if (!isTextBlockNode(block) || block.type === "codeBlock") {
    return undefined;
  }

  if (isCollapsed(range)) {
    const textNode = block.children[anchorTextIndex];

    return textNode ? { range, textNodes: [textNode] } : undefined;
  }

  const textNodes = block.children
    .slice(anchorTextIndex, focusTextIndex + 1)
    .filter((node, index) => {
      const textIndex = anchorTextIndex + index;
      const selectionStart = textIndex === anchorTextIndex ? range.anchor.offset : 0;
      const selectionEnd =
        textIndex === focusTextIndex ? range.focus.offset : node.text.length;

      return selectionStart < selectionEnd;
    });

  return textNodes && textNodes.length > 0 ? { range, textNodes } : undefined;
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

  const operation = createSetLinkOperation(target.range, link);

  return createCommandSuccess(commandName, {
    selection: createSelectionAfterSetLink(input.context.document, operation),
    transaction: createTransaction([operation]),
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
