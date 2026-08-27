import { describe, expect, it } from "vitest";

import * as core from "../src/index";

describe("@crucialy-rich/core public API", () => {
  it("exposes an importable package entry", () => {
    expect(core).toBeDefined();
  });

  it("exposes the document model API", () => {
    expect(core.BLOCK_TYPES).toEqual(["paragraph", "heading", "quote"]);
    expect(core.HEADING_LEVELS).toEqual([1, 2, 3, 4, 5, 6]);
    expect(typeof core.createDocument).toBe("function");
    expect(typeof core.createHeading).toBe("function");
    expect(typeof core.createParagraph).toBe("function");
    expect(typeof core.createQuote).toBe("function");
    expect(typeof core.createText).toBe("function");
    expect(core.TEXT_MARK_TYPES).toEqual(["bold", "italic", "underline", "strike"]);
    expect(core.TEXT_MARK_ATTRIBUTE_TYPES).toEqual([
      "fontSize",
      "textColor",
      "backgroundColor",
    ]);
    expect(core.LINK_TARGETS).toEqual(["_self", "_blank"]);
    expect(core.LINK_REL_TOKENS).toEqual(["nofollow", "noopener", "noreferrer"]);
    expect(core.LINK_PROTOCOLS).toEqual(["http:", "https:", "mailto:"]);
    expect(typeof core.addTextMark).toBe("function");
    expect(typeof core.areLinkMarksEqual).toBe("function");
    expect(typeof core.areTextMarksEqual).toBe("function");
    expect(typeof core.getTextMarkAttribute).toBe("function");
    expect(typeof core.getLinkMark).toBe("function");
    expect(typeof core.hasTextMark).toBe("function");
    expect(typeof core.isValidTextMarkAttributeValue).toBe("function");
    expect(core.MIN_FONT_SIZE).toBe(8);
    expect(core.MAX_FONT_SIZE).toBe(72);
    expect(typeof core.isValidFontSize).toBe("function");
    expect(typeof core.isValidLinkMark).toBe("function");
    expect(typeof core.sanitizeHexColor).toBe("function");
    expect(typeof core.sanitizeLinkHref).toBe("function");
    expect(typeof core.mergeAdjacentTextNodes).toBe("function");
    expect(typeof core.normalizeTextMarks).toBe("function");
    expect(typeof core.normalizeLinkRel).toBe("function");
    expect(typeof core.normalizeLinkMark).toBe("function");
    expect(typeof core.normalizeLinkTarget).toBe("function");
    expect(typeof core.removeTextMark).toBe("function");
    expect(typeof core.removeLinkMark).toBe("function");
    expect(typeof core.removeTextMarkAttribute).toBe("function");
    expect(typeof core.setTextMarkAttribute).toBe("function");
    expect(typeof core.setLinkMark).toBe("function");
    expect(typeof core.setTextMark).toBe("function");
    expect(typeof core.toggleTextMark).toBe("function");
    expect(typeof core.validateDocument).toBe("function");
    expect(typeof core.normalizeDocument).toBe("function");
    expect(typeof core.isDocumentNode).toBe("function");
    expect(typeof core.isHeadingLevel).toBe("function");
    expect(typeof core.isHeadingNode).toBe("function");
    expect(typeof core.isQuoteNode).toBe("function");
  });

  it("exposes the complete link feature namespace", () => {
    expect(core.link.LINK_PROTOCOLS).toEqual(["http:", "https:", "mailto:"]);
    expect(core.link.LINK_TARGETS).toEqual(["_self", "_blank"]);
    expect(core.link.LINK_REL_TOKENS).toEqual(["nofollow", "noopener", "noreferrer"]);
    expect(typeof core.link.sanitizeLinkHref).toBe("function");
    expect(typeof core.link.normalizeLinkMark).toBe("function");
    expect(typeof core.link.getLinkMark).toBe("function");
    expect(typeof core.link.setLinkMark).toBe("function");
    expect(typeof core.link.removeLinkMark).toBe("function");
    expect(typeof core.link.createSetLinkOperation).toBe("function");
    expect(typeof core.link.applySetLink).toBe("function");
    expect(typeof core.link.createSelectionAfterSetLink).toBe("function");
    expect(core.link.LINK_COMMANDS.map((command) => command.name)).toEqual([
      "setLink",
      "unsetLink",
    ]);
    expect(typeof core.link.canExecuteSetLinkCommand).toBe("function");
    expect(typeof core.link.canExecuteUnsetLinkCommand).toBe("function");
    expect(typeof core.link.getSelectedLinkMark).toBe("function");
  });

  it("exposes the selection API", () => {
    expect(typeof core.cloneRangeSelection).toBe("function");
    expect(typeof core.getNodeAtPath).toBe("function");
    expect(typeof core.hasNodeAtPath).toBe("function");
    expect(typeof core.isValidPoint).toBe("function");
    expect(typeof core.comparePoint).toBe("function");
    expect(typeof core.compareRange).toBe("function");
    expect(typeof core.getParagraphTextOffset).toBe("function");
    expect(typeof core.getPointAtParagraphTextOffset).toBe("function");
    expect(typeof core.isCollapsed).toBe("function");
    expect(typeof core.normalizeRange).toBe("function");
    expect(typeof core.getTextInRange).toBe("function");
    expect(typeof core.splitTextByRange).toBe("function");
  });

  it("exposes the render API", () => {
    expect(typeof core.MODEL_PATH_ATTRIBUTE).toBe("string");
    expect(typeof core.createModelPathAttributes).toBe("function");
    expect(typeof core.encodeModelPath).toBe("function");
    expect(typeof core.decodeModelPath).toBe("function");
    expect(typeof core.domPointToModelPoint).toBe("function");
    expect(typeof core.findClosestModelPathElement).toBe("function");
    expect(typeof core.findElementByModelPath).toBe("function");
    expect(typeof core.getElementModelPath).toBe("function");
    expect(typeof core.modelPointToDomPoint).toBe("function");
    expect(typeof core.domSelectionToModelSelection).toBe("function");
    expect(typeof core.createDomRangeFromModelSelection).toBe("function");
    expect(typeof core.applyModelSelectionToDom).toBe("function");
    expect(typeof core.renderDocument).toBe("function");
    expect(typeof core.renderNodeToHtml).toBe("function");
  });

  it("exposes the operation API", () => {
    expect(typeof core.createInsertTextOperation).toBe("function");
    expect(typeof core.applyInsertText).toBe("function");
    expect(typeof core.createSelectionAfterInsertText).toBe("function");
    expect(typeof core.createDeleteTextOperation).toBe("function");
    expect(typeof core.applyDeleteText).toBe("function");
    expect(typeof core.createSelectionAfterDeleteText).toBe("function");
    expect(typeof core.createSplitBlockOperation).toBe("function");
    expect(typeof core.applySplitBlock).toBe("function");
    expect(typeof core.createSelectionAfterSplitBlock).toBe("function");
    expect(typeof core.createMergeBlockOperation).toBe("function");
    expect(typeof core.applyMergeBlock).toBe("function");
    expect(typeof core.createSelectionAfterMergeBlock).toBe("function");
    expect(typeof core.createToggleMarkOperation).toBe("function");
    expect(typeof core.applyToggleMark).toBe("function");
    expect(typeof core.createSelectionAfterToggleMark).toBe("function");
    expect(typeof core.createSetMarkAttributeOperation).toBe("function");
    expect(typeof core.applySetMarkAttribute).toBe("function");
    expect(typeof core.createSelectionAfterSetMarkAttribute).toBe("function");
    expect(typeof core.createSetLinkOperation).toBe("function");
    expect(typeof core.applySetLink).toBe("function");
    expect(typeof core.createSelectionAfterSetLink).toBe("function");
    expect(typeof core.createSetBlockTypeOperation).toBe("function");
    expect(typeof core.applySetBlockType).toBe("function");
    expect(typeof core.createTransaction).toBe("function");
    expect(typeof core.applyOperation).toBe("function");
    expect(typeof core.applyTransaction).toBe("function");
    expect(core.OPERATION_TYPES).toEqual([
      "insert_text",
      "delete_text",
      "toggle_mark",
      "set_mark_attribute",
      "set_link",
      "set_block_type",
      "split_block",
      "merge_block",
    ]);
    expect(typeof core.isTextOperation).toBe("function");
    expect(typeof core.isBlockOperation).toBe("function");
    expect(typeof core.summarizeOperation).toBe("function");
    expect(typeof core.summarizeTransaction).toBe("function");
    expect(typeof core.createTransactionAcceptanceReport).toBe("function");
  });

  it("exposes the input API", () => {
    expect(typeof core.createBackspaceInputTransaction).toBe("function");
    expect(typeof core.createSelectionAfterBackspaceInput).toBe("function");
    expect(typeof core.createDeleteInputTransaction).toBe("function");
    expect(typeof core.createSelectionAfterDeleteInput).toBe("function");
    expect(typeof core.createEnterInputTransaction).toBe("function");
    expect(typeof core.createSelectionAfterEnterInput).toBe("function");
    expect(typeof core.createInsertTextInputTransaction).toBe("function");
    expect(typeof core.createSelectionAfterInsertTextInput).toBe("function");
  });

  it("exposes the history API", () => {
    expect(typeof core.REDO_COMMAND_NAME).toBe("string");
    expect(typeof core.UNDO_COMMAND_NAME).toBe("string");
    expect(typeof core.canExecuteRedoCommand).toBe("function");
    expect(typeof core.canExecuteUndoCommand).toBe("function");
    expect(typeof core.canMergeHistoryEntries).toBe("function");
    expect(typeof core.canRedo).toBe("function");
    expect(typeof core.canUndo).toBe("function");
    expect(typeof core.clearHistory).toBe("function");
    expect(typeof core.cloneHistoryEntry).toBe("function");
    expect(typeof core.cloneHistorySnapshot).toBe("function");
    expect(typeof core.createHistoryEntry).toBe("function");
    expect(typeof core.createHistorySnapshot).toBe("function");
    expect(typeof core.createHistoryState).toBe("function");
    expect(typeof core.getRedoEntry).toBe("function");
    expect(typeof core.getHistoryShortcutAction).toBe("function");
    expect(typeof core.getUndoEntry).toBe("function");
    expect(typeof core.mergeHistoryEntries).toBe("function");
    expect(typeof core.recordHistory).toBe("function");
    expect(typeof core.redoCommand).toBe("object");
    expect(typeof core.redoHistory).toBe("function");
    expect(typeof core.undoCommand).toBe("object");
    expect(typeof core.undoHistory).toBe("function");
  });

  it("exposes the command API", () => {
    expect(typeof core.BOLD_COMMAND_NAME).toBe("string");
    expect(core.BOOLEAN_MARK_COMMANDS.map((command) => command.name)).toEqual([
      "bold",
      "italic",
      "underline",
      "strike",
    ]);
    expect(core.TEXT_STYLE_COMMANDS.map((command) => command.name)).toEqual([
      "setFontSize",
      "setTextColor",
      "setBackgroundColor",
    ]);
    expect(core.LINK_COMMANDS.map((command) => command.name)).toEqual([
      "setLink",
      "unsetLink",
    ]);
    expect(Array.isArray(core.DEFAULT_COMMAND_SHORTCUTS)).toBe(true);
    expect(typeof core.DELETE_SELECTION_COMMAND_NAME).toBe("string");
    expect(typeof core.INSERT_TEXT_COMMAND_NAME).toBe("string");
    expect(typeof core.ITALIC_COMMAND_NAME).toBe("string");
    expect(typeof core.MERGE_BLOCK_COMMAND_NAME).toBe("string");
    expect(typeof core.SET_BACKGROUND_COLOR_COMMAND_NAME).toBe("string");
    expect(typeof core.SET_HEADING_COMMAND_NAME).toBe("string");
    expect(typeof core.SET_LINK_COMMAND_NAME).toBe("string");
    expect(typeof core.SPLIT_BLOCK_COMMAND_NAME).toBe("string");
    expect(typeof core.STRIKE_COMMAND_NAME).toBe("string");
    expect(typeof core.SET_FONT_SIZE_COMMAND_NAME).toBe("string");
    expect(typeof core.SET_TEXT_COLOR_COMMAND_NAME).toBe("string");
    expect(typeof core.UNDERLINE_COMMAND_NAME).toBe("string");
    expect(typeof core.UNSET_LINK_COMMAND_NAME).toBe("string");
    expect(typeof core.canExecuteBoldCommand).toBe("function");
    expect(typeof core.canExecuteCommand).toBe("function");
    expect(typeof core.canExecuteDeleteSelectionCommand).toBe("function");
    expect(typeof core.canExecuteInsertTextCommand).toBe("function");
    expect(typeof core.canExecuteItalicCommand).toBe("function");
    expect(typeof core.canExecuteMergeBlockCommand).toBe("function");
    expect(typeof core.canExecuteSetBackgroundColorCommand).toBe("function");
    expect(typeof core.canExecuteSetHeadingCommand).toBe("function");
    expect(typeof core.canExecuteSetLinkCommand).toBe("function");
    expect(typeof core.canExecuteSplitBlockCommand).toBe("function");
    expect(typeof core.canExecuteStrikeCommand).toBe("function");
    expect(typeof core.canExecuteSetFontSizeCommand).toBe("function");
    expect(typeof core.canExecuteSetTextColorCommand).toBe("function");
    expect(typeof core.canExecuteTextMarkCommand).toBe("function");
    expect(typeof core.canExecuteUnderlineCommand).toBe("function");
    expect(typeof core.canExecuteUnsetLinkCommand).toBe("function");
    expect(typeof core.createCommandFailure).toBe("function");
    expect(typeof core.createDefaultCommandRegistry).toBe("function");
    expect(typeof core.createCommandRegistry).toBe("function");
    expect(typeof core.createCommandSkipped).toBe("function");
    expect(typeof core.createCommandSuccess).toBe("function");
    expect(typeof core.createTextMarkCommand).toBe("function");
    expect(core.DEFAULT_COMMANDS.map((command) => command.name)).toEqual([
      "bold",
      "italic",
      "underline",
      "strike",
      "setFontSize",
      "setTextColor",
      "setBackgroundColor",
      "setLink",
      "unsetLink",
      "setHeading",
      "deleteSelection",
      "insertText",
      "mergeBlock",
      "splitBlock",
    ]);
    expect(typeof core.boldCommand).toBe("object");
    expect(typeof core.deleteSelectionCommand).toBe("object");
    expect(typeof core.executeCommand).toBe("function");
    expect(typeof core.getCommandNameFromShortcut).toBe("function");
    expect(typeof core.getCommandShortcuts).toBe("function");
    expect(typeof core.getSelectedLinkMark).toBe("function");
    expect(typeof core.getSelectedHeadingLevel).toBe("function");
    expect(typeof core.insertTextCommand).toBe("object");
    expect(typeof core.isBoldCommandActive).toBe("function");
    expect(typeof core.isItalicCommandActive).toBe("function");
    expect(typeof core.isLinkCommandActive).toBe("function");
    expect(typeof core.isHeadingCommandActive).toBe("function");
    expect(typeof core.isStrikeCommandActive).toBe("function");
    expect(typeof core.isTextMarkCommandActive).toBe("function");
    expect(typeof core.isUnderlineCommandActive).toBe("function");
    expect(typeof core.italicCommand).toBe("object");
    expect(typeof core.mergeBlockCommand).toBe("object");
    expect(typeof core.queryCommandState).toBe("function");
    expect(typeof core.splitBlockCommand).toBe("object");
    expect(typeof core.strikeCommand).toBe("object");
    expect(typeof core.setFontSizeCommand).toBe("object");
    expect(typeof core.setHeadingCommand).toBe("object");
    expect(typeof core.setBackgroundColorCommand).toBe("object");
    expect(typeof core.setTextColorCommand).toBe("object");
    expect(typeof core.setLinkCommand).toBe("object");
    expect(typeof core.underlineCommand).toBe("object");
    expect(typeof core.unsetLinkCommand).toBe("object");
  });
});
