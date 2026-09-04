export {
  canExecuteSetBackgroundColorCommand,
  SET_BACKGROUND_COLOR_COMMAND_NAME,
  setBackgroundColorCommand,
} from "./background-color";
export type { SetBackgroundColorCommandPayload } from "./background-color";
export {
  canExecuteMergeBlockCommand,
  canExecuteSplitBlockCommand,
  MERGE_BLOCK_COMMAND_NAME,
  mergeBlockCommand,
  SPLIT_BLOCK_COMMAND_NAME,
  splitBlockCommand,
} from "./block";
export { doSelectedBlocksMatch, getSelectedBlockIndexes } from "./block-selection";
export { BLOCK_TYPE_COMMANDS } from "./block-type";
export {
  canExecuteSetCodeBlockCommand,
  isCodeBlockCommandActive,
  SET_CODE_BLOCK_COMMAND_NAME,
  setCodeBlockCommand,
} from "./code-block";
export type { SetCodeBlockCommandPayload } from "./code-block";
export {
  canExecuteSetFontSizeCommand,
  SET_FONT_SIZE_COMMAND_NAME,
  setFontSizeCommand,
} from "./font-size";
export type { SetFontSizeCommandPayload } from "./font-size";
export {
  canExecuteSetHeadingCommand,
  getSelectedHeadingLevel,
  isHeadingCommandActive,
  SET_HEADING_COMMAND_NAME,
  setHeadingCommand,
} from "./heading";
export type { SetHeadingCommandPayload } from "./heading";
export {
  canExecuteToggleQuoteCommand,
  isQuoteCommandActive,
  TOGGLE_QUOTE_COMMAND_NAME,
  toggleQuoteCommand,
} from "./quote";
export {
  canExecuteSetLinkCommand,
  canExecuteUnsetLinkCommand,
  getSelectedLinkMark,
  isLinkCommandActive,
  LINK_COMMANDS,
  SET_LINK_COMMAND_NAME,
  setLinkCommand,
  UNSET_LINK_COMMAND_NAME,
  unsetLinkCommand,
} from "./link";
export type { SetLinkCommandPayload } from "./link";
export {
  canExecuteSetTextColorCommand,
  SET_TEXT_COLOR_COMMAND_NAME,
  setTextColorCommand,
} from "./text-color";
export type { SetTextColorCommandPayload } from "./text-color";
export { TEXT_STYLE_COMMANDS } from "./text-style";
export {
  BOLD_COMMAND_NAME,
  BOOLEAN_MARK_COMMANDS,
  ITALIC_COMMAND_NAME,
  STRIKE_COMMAND_NAME,
  UNDERLINE_COMMAND_NAME,
  boldCommand,
  canExecuteBoldCommand,
  canExecuteItalicCommand,
  canExecuteStrikeCommand,
  canExecuteTextMarkCommand,
  canExecuteUnderlineCommand,
  createTextMarkCommand,
  isBoldCommandActive,
  isItalicCommandActive,
  isStrikeCommandActive,
  isTextMarkCommandActive,
  isUnderlineCommandActive,
  italicCommand,
  strikeCommand,
  underlineCommand,
} from "./mark";
export type { TextMarkCommandConfig } from "./mark";
export { canExecuteCommand } from "./can-execute";
export { createDefaultCommandRegistry, DEFAULT_COMMANDS } from "./defaults";
export { executeCommand } from "./execute";
export {
  createCommandFailure,
  createCommandSkipped,
  createCommandSuccess,
} from "./result";
export { queryCommandState, type CommandState } from "./state";
export { createCommandRegistry, type CommandRegistry } from "./registry";
export {
  DEFAULT_COMMAND_SHORTCUTS,
  getCommandNameFromShortcut,
  getCommandShortcuts,
} from "./shortcut";
export type { CommandShortcutBinding, CommandShortcutInput } from "./shortcut";
export {
  canExecuteInsertTextCommand,
  canExecuteDeleteSelectionCommand,
  DELETE_SELECTION_COMMAND_NAME,
  deleteSelectionCommand,
  INSERT_TEXT_COMMAND_NAME,
  insertTextCommand,
} from "./text";
export type { InsertTextCommandPayload } from "./text";
export type {
  Command,
  CommandContext,
  CommandInput,
  CommandName,
  CommandResult,
  CommandResultStatus,
} from "./types";
