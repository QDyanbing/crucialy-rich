import { describe, expect, it } from "vitest";

import * as core from "../src/index";

describe("@crucialy-rich/core public API", () => {
  it("exposes an importable package entry", () => {
    expect(core).toBeDefined();
  });

  it("exposes the document model API", () => {
    expect(typeof core.createDocument).toBe("function");
    expect(typeof core.createParagraph).toBe("function");
    expect(typeof core.createText).toBe("function");
    expect(core.TEXT_MARK_TYPES).toEqual(["bold", "italic"]);
    expect(typeof core.addTextMark).toBe("function");
    expect(typeof core.areTextMarksEqual).toBe("function");
    expect(typeof core.hasTextMark).toBe("function");
    expect(typeof core.normalizeTextMarks).toBe("function");
    expect(typeof core.removeTextMark).toBe("function");
    expect(typeof core.toggleTextMark).toBe("function");
    expect(typeof core.validateDocument).toBe("function");
    expect(typeof core.normalizeDocument).toBe("function");
    expect(typeof core.isDocumentNode).toBe("function");
  });

  it("exposes the selection API", () => {
    expect(typeof core.getNodeAtPath).toBe("function");
    expect(typeof core.hasNodeAtPath).toBe("function");
    expect(typeof core.isValidPoint).toBe("function");
    expect(typeof core.comparePoint).toBe("function");
    expect(typeof core.compareRange).toBe("function");
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
    expect(typeof core.createTransaction).toBe("function");
    expect(typeof core.applyOperation).toBe("function");
    expect(typeof core.applyTransaction).toBe("function");
    expect(core.OPERATION_TYPES).toEqual([
      "insert_text",
      "delete_text",
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
    expect(typeof core.DELETE_SELECTION_COMMAND_NAME).toBe("string");
    expect(typeof core.INSERT_TEXT_COMMAND_NAME).toBe("string");
    expect(typeof core.MERGE_BLOCK_COMMAND_NAME).toBe("string");
    expect(typeof core.SPLIT_BLOCK_COMMAND_NAME).toBe("string");
    expect(typeof core.canExecuteCommand).toBe("function");
    expect(typeof core.canExecuteDeleteSelectionCommand).toBe("function");
    expect(typeof core.canExecuteInsertTextCommand).toBe("function");
    expect(typeof core.canExecuteMergeBlockCommand).toBe("function");
    expect(typeof core.canExecuteSplitBlockCommand).toBe("function");
    expect(typeof core.createCommandFailure).toBe("function");
    expect(typeof core.createDefaultCommandRegistry).toBe("function");
    expect(typeof core.createCommandRegistry).toBe("function");
    expect(typeof core.createCommandSkipped).toBe("function");
    expect(typeof core.createCommandSuccess).toBe("function");
    expect(core.DEFAULT_COMMANDS.map((command) => command.name)).toEqual([
      "deleteSelection",
      "insertText",
      "mergeBlock",
      "splitBlock",
    ]);
    expect(typeof core.deleteSelectionCommand).toBe("object");
    expect(typeof core.executeCommand).toBe("function");
    expect(typeof core.insertTextCommand).toBe("object");
    expect(typeof core.mergeBlockCommand).toBe("object");
    expect(typeof core.queryCommandState).toBe("function");
    expect(typeof core.splitBlockCommand).toBe("object");
  });
});
