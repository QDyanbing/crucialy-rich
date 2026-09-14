import {
  applyTransaction,
  applyModelSelectionToDom,
  createDefaultCommandRegistry,
  DEFAULT_CLIPBOARD_PARSERS,
  createDocument,
  createBackspaceInputTransaction,
  createBlockSelection,
  createDeleteInputTransaction,
  createSelectionAfterBackspaceInput,
  createSelectionAfterDeleteInput,
  createSelectionAfterTabInput,
  createSetTaskItemCheckedOperation,
  createTabInputTransaction,
  createTransaction,
  DELETE_SELECTION_COMMAND_NAME,
  DELETE_IMAGE_COMMAND_NAME,
  domSelectionToModelSelection,
  executeCommand,
  getNodeAtPath,
  getElementModelPath,
  INSERT_TEXT_COMMAND_NAME,
  isCollapsed,
  isTextNode,
  MERGE_BLOCK_COMMAND_NAME,
  parseClipboardData,
  PASTE_COMMAND_NAME,
  renderDocument,
  SPLIT_BLOCK_COMMAND_NAME,
  type CommandResult,
  type BlockSelection,
  type DocumentNode,
  type RangeSelection,
  type RenderedElementNode,
  type Transaction,
} from "@crucialy-rich/core";
import {
  createElement,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ClipboardEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
} from "react";

export interface RichTextEditorProps
  extends Pick<
    HTMLAttributes<HTMLDivElement>,
    | "className"
    | "contentEditable"
    | "onBeforeInput"
    | "onClick"
    | "onKeyDown"
    | "onKeyUp"
    | "onMouseUp"
    | "onPaste"
    | "suppressContentEditableWarning"
  > {
  defaultValue?: DocumentNode;
  blockSelection?: BlockSelection;
  label?: string;
  onBlockSelectionChange?: (selection: BlockSelection | undefined) => void;
  onChange?: (value: DocumentNode) => void;
  onSelectionChange?: (selection: RangeSelection) => void;
  onTransaction?: (event: RichTextEditorTransactionEvent) => void;
  selection?: RangeSelection;
  value?: DocumentNode;
}

export type RichTextEditorInputType =
  | "deleteBackward"
  | "deleteImage"
  | "deleteForward"
  | "insertParagraph"
  | "insertFromPaste"
  | "insertText"
  | "indentListItem"
  | "outdentListItem"
  | "setTaskItemChecked";

export interface RichTextEditorTransactionEvent {
  after: DocumentNode;
  batch?: string;
  before: DocumentNode;
  beforeSelection: RangeSelection;
  inputType: RichTextEditorInputType;
  selection: RangeSelection;
  transaction: Transaction;
}

function arePathsEqual(left: number[], right: number[]): boolean {
  return (
    left.length === right.length && left.every((part, index) => part === right[index])
  );
}

function createRenderedElement(
  node: RenderedElementNode,
  blockSelection?: BlockSelection,
): ReactElement {
  const children =
    node.children?.map((child) => createRenderedElement(child, blockSelection)) ??
    node.text;
  const selected =
    node.tagName === "img" &&
    blockSelection !== undefined &&
    arePathsEqual(node.path, blockSelection.path);

  return createElement(
    node.tagName,
    {
      ...node.attributes,
      key: node.path.join(".") || "root",
      ...(selected ? { "data-selected": "true" } : {}),
      ...(node.style ? { style: node.style } : {}),
    },
    children,
  );
}

function isEditableContent(contentEditable: RichTextEditorProps["contentEditable"]) {
  return contentEditable === true || contentEditable === "true";
}

function getInsertTextInputData(event: Event): string | undefined {
  const inputEvent = event as InputEvent;

  if (inputEvent.inputType && inputEvent.inputType !== "insertText") {
    return undefined;
  }

  return inputEvent.data || undefined;
}

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

const richTextCommandRegistry = createDefaultCommandRegistry();

interface KeyboardInputResult {
  batch?: string;
  beforeSelection: RangeSelection;
  inputType: RichTextEditorInputType;
  selection: RangeSelection;
  transaction: Transaction;
}

function createKeyboardInputResultFromCommandResult(
  result: CommandResult,
  beforeSelection: RangeSelection,
  inputType: KeyboardInputResult["inputType"],
  batch?: string,
): KeyboardInputResult | undefined {
  if (!result.ok || !result.selection || !result.transaction) {
    return undefined;
  }

  const inputResult: KeyboardInputResult = {
    beforeSelection,
    inputType,
    selection: result.selection,
    transaction: result.transaction,
  };

  return batch ? { ...inputResult, batch } : inputResult;
}

function getModelSelectionFromDom(root: HTMLDivElement, document: DocumentNode) {
  const domSelection = root.ownerDocument.getSelection();

  return domSelection
    ? domSelectionToModelSelection(document, domSelection)
    : undefined;
}

function createKeyboardInputResult(
  key: string,
  document: DocumentNode,
  selection: RangeSelection,
  shiftKey = false,
): KeyboardInputResult | undefined {
  if (key === "Tab") {
    const input = { document, selection, shiftKey };
    const transaction = createTabInputTransaction(input);

    return transaction.operations.length > 0
      ? {
          beforeSelection: selection,
          inputType: shiftKey ? "outdentListItem" : "indentListItem",
          selection: createSelectionAfterTabInput(input),
          transaction,
        }
      : undefined;
  }

  if (key === "Backspace") {
    const input = {
      document,
      selection,
    };

    return {
      beforeSelection: selection,
      inputType: "deleteBackward",
      selection: createSelectionAfterBackspaceInput(input),
      transaction: createBackspaceInputTransaction(input),
    };
  }

  if (key === "Delete") {
    const input = {
      document,
      selection,
    };

    return {
      beforeSelection: selection,
      inputType: "deleteForward",
      selection: createSelectionAfterDeleteInput(input),
      transaction: createDeleteInputTransaction(input),
    };
  }

  return undefined;
}

function createInsertTextCommandResult(
  document: DocumentNode,
  selection: RangeSelection,
  text: string,
): KeyboardInputResult | undefined {
  const result = executeCommand(richTextCommandRegistry, INSERT_TEXT_COMMAND_NAME, {
    context: {
      document,
      selection,
    },
    payload: {
      text,
    },
  });

  return createKeyboardInputResultFromCommandResult(
    result,
    selection,
    "insertText",
    "typing",
  );
}

function createDeleteSelectionCommandResult(
  document: DocumentNode,
  selection: RangeSelection,
  inputType: KeyboardInputResult["inputType"],
): KeyboardInputResult | undefined {
  const result = executeCommand(
    richTextCommandRegistry,
    DELETE_SELECTION_COMMAND_NAME,
    {
      context: {
        document,
        selection,
      },
    },
  );

  return createKeyboardInputResultFromCommandResult(result, selection, inputType);
}

function createDeleteImageCommandResult(
  document: DocumentNode,
  blockSelection: BlockSelection,
): KeyboardInputResult | undefined {
  const result = executeCommand(richTextCommandRegistry, DELETE_IMAGE_COMMAND_NAME, {
    context: { document },
    payload: { selection: blockSelection },
  });

  return result.selection
    ? createKeyboardInputResultFromCommandResult(
        result,
        result.selection,
        "deleteImage",
      )
    : undefined;
}

function createSplitBlockCommandResult(
  document: DocumentNode,
  selection: RangeSelection,
): KeyboardInputResult | undefined {
  const result = executeCommand(richTextCommandRegistry, SPLIT_BLOCK_COMMAND_NAME, {
    context: {
      document,
      selection,
    },
  });

  return createKeyboardInputResultFromCommandResult(
    result,
    selection,
    "insertParagraph",
  );
}

function createMergeBlockCommandResult(
  document: DocumentNode,
  selection: RangeSelection,
  inputType: KeyboardInputResult["inputType"] = "deleteBackward",
): KeyboardInputResult | undefined {
  const result = executeCommand(richTextCommandRegistry, MERGE_BLOCK_COMMAND_NAME, {
    context: {
      document,
      selection,
    },
  });

  return createKeyboardInputResultFromCommandResult(result, selection, inputType);
}

function createCollapsedSelection(point: RangeSelection["anchor"]): RangeSelection {
  return {
    anchor: {
      path: [...point.path],
      offset: point.offset,
    },
    focus: {
      path: [...point.path],
      offset: point.offset,
    },
  };
}

function createMergeNextBlockCommandResult(
  document: DocumentNode,
  selection: RangeSelection,
): KeyboardInputResult | undefined {
  if (!isCollapsed(selection)) {
    return undefined;
  }

  const point = selection.anchor;
  const [blockIndex] = point.path;
  const node = getNodeAtPath(document, point.path);

  if (
    blockIndex === undefined ||
    blockIndex >= document.children.length - 1 ||
    !isTextNode(node) ||
    point.offset !== node.text.length
  ) {
    return undefined;
  }

  return createMergeBlockCommandResult(
    document,
    createCollapsedSelection({
      path: [blockIndex + 1, 0],
      offset: 0,
    }),
    "deleteForward",
  );
}

export function RichTextEditor({
  blockSelection,
  className,
  contentEditable,
  defaultValue,
  label = "Rich text editor",
  onBeforeInput,
  onBlockSelectionChange,
  onClick,
  onKeyDown,
  onKeyUp,
  onMouseUp,
  onPaste,
  onChange,
  onSelectionChange,
  onTransaction,
  selection,
  suppressContentEditableWarning,
  value,
}: RichTextEditorProps): ReactElement {
  const rootRef = useRef<HTMLDivElement>(null);
  const [uncontrolledDocument, setUncontrolledDocument] = useState(
    () => defaultValue ?? createDocument(),
  );
  const controlled = value !== undefined;
  const document = value ?? uncontrolledDocument;
  const renderedDocument = useMemo(() => renderDocument(document), [document]);
  const editable = isEditableContent(contentEditable);

  useIsomorphicLayoutEffect(() => {
    if (!selection || !rootRef.current) {
      return;
    }

    applyModelSelectionToDom(rootRef.current, document, selection);
  }, [document, selection]);

  function commitDocumentChange(nextDocument: DocumentNode) {
    if (!controlled) {
      setUncontrolledDocument(nextDocument);
    }

    onChange?.(nextDocument);
  }

  function commitInputResult(input: KeyboardInputResult) {
    if (input.transaction.operations.length > 0) {
      const nextDocument = applyTransaction(document, input.transaction);

      commitDocumentChange(nextDocument);
      const transactionEvent: RichTextEditorTransactionEvent = {
        after: nextDocument,
        before: document,
        beforeSelection: input.beforeSelection,
        inputType: input.inputType,
        selection: input.selection,
        transaction: input.transaction,
      };

      onTransaction?.(
        input.batch ? { ...transactionEvent, batch: input.batch } : transactionEvent,
      );
    }

    onSelectionChange?.(input.selection);
  }

  function handleBeforeInput(event: FormEvent<HTMLDivElement>) {
    onBeforeInput?.(event);

    if (event.defaultPrevented || !editable) {
      return;
    }

    const data = getInsertTextInputData(event.nativeEvent);

    if (!data) {
      return;
    }

    const modelSelection = getModelSelectionFromDom(event.currentTarget, document);

    if (!modelSelection) {
      return;
    }

    const input = createInsertTextCommandResult(document, modelSelection, data);

    event.preventDefault();

    if (input) {
      commitInputResult(input);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);

    if (event.defaultPrevented || !editable) {
      return;
    }

    if (blockSelection && (event.key === "Backspace" || event.key === "Delete")) {
      const deleteImageInput = createDeleteImageCommandResult(document, blockSelection);

      if (deleteImageInput) {
        event.preventDefault();
        commitInputResult(deleteImageInput);
        onBlockSelectionChange?.(undefined);

        return;
      }
    }

    const modelSelection = getModelSelectionFromDom(event.currentTarget, document);

    if (!modelSelection) {
      return;
    }

    if (event.key === "Enter") {
      const splitBlockInput = createSplitBlockCommandResult(document, modelSelection);

      if (splitBlockInput) {
        event.preventDefault();
        commitInputResult(splitBlockInput);

        return;
      }
    }

    if (event.key === "Backspace" || event.key === "Delete") {
      const deleteSelectionInput = createDeleteSelectionCommandResult(
        document,
        modelSelection,
        event.key === "Backspace" ? "deleteBackward" : "deleteForward",
      );

      if (deleteSelectionInput) {
        event.preventDefault();
        commitInputResult(deleteSelectionInput);

        return;
      }
    }

    if (event.key === "Backspace") {
      const mergeBlockInput = createMergeBlockCommandResult(document, modelSelection);

      if (mergeBlockInput) {
        event.preventDefault();
        commitInputResult(mergeBlockInput);

        return;
      }
    }

    if (event.key === "Delete") {
      const mergeNextBlockInput = createMergeNextBlockCommandResult(
        document,
        modelSelection,
      );

      if (mergeNextBlockInput) {
        event.preventDefault();
        commitInputResult(mergeNextBlockInput);

        return;
      }
    }

    const input = createKeyboardInputResult(
      event.key,
      document,
      modelSelection,
      event.shiftKey,
    );

    if (!input) {
      return;
    }

    event.preventDefault();
    commitInputResult(input);
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    onPaste?.(event);

    if (event.defaultPrevented || !editable) {
      return;
    }

    const modelSelection = getModelSelectionFromDom(event.currentTarget, document);
    const fragment = parseClipboardData(
      {
        getData: (mimeType) => event.clipboardData.getData(mimeType),
        types: Array.from(event.clipboardData.types),
      },
      DEFAULT_CLIPBOARD_PARSERS,
    );

    if (!modelSelection || !fragment) {
      return;
    }

    const result = executeCommand(richTextCommandRegistry, PASTE_COMMAND_NAME, {
      context: { document, selection: modelSelection },
      payload: { fragment },
    });
    const input = createKeyboardInputResultFromCommandResult(
      result,
      modelSelection,
      "insertFromPaste",
    );

    if (input) {
      event.preventDefault();
      commitInputResult(input);
    }
  }

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    onClick?.(event);

    if (!editable || !(event.target instanceof Element)) {
      return;
    }

    const image = event.target.closest<HTMLImageElement>(
      'img[data-crucialy-image="true"]',
    );

    if (image && event.currentTarget.contains(image)) {
      const imagePath = getElementModelPath(image);

      if (imagePath) {
        event.preventDefault();
        event.currentTarget.focus();
        onBlockSelectionChange?.(createBlockSelection(imagePath));
      }

      return;
    }

    onBlockSelectionChange?.(undefined);

    const taskControl = event.target.closest<HTMLInputElement>(
      'input[data-crucialy-task-item="true"]',
    );

    if (taskControl && event.currentTarget.contains(taskControl)) {
      const itemPath = getElementModelPath(taskControl);

      if (itemPath) {
        const currentSelection = getModelSelectionFromDom(
          event.currentTarget,
          document,
        ) ??
          selection ?? {
            anchor: { offset: 0, path: [...itemPath, 0] },
            focus: { offset: 0, path: [...itemPath, 0] },
          };

        commitInputResult({
          beforeSelection: currentSelection,
          inputType: "setTaskItemChecked",
          selection: currentSelection,
          transaction: createTransaction([
            createSetTaskItemCheckedOperation(itemPath, taskControl.checked),
          ]),
        });
      }

      return;
    }

    const link = event.target.closest("a[href]");

    if (link && event.currentTarget.contains(link)) {
      event.preventDefault();
    }
  }

  return (
    <div
      {...renderedDocument.attributes}
      ref={rootRef}
      aria-label={label}
      aria-readonly={editable ? "false" : "true"}
      className={className}
      contentEditable={contentEditable}
      data-crucialy-rich-editor="true"
      onBeforeInput={handleBeforeInput}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onKeyUp={onKeyUp}
      onMouseUp={onMouseUp}
      onPaste={handlePaste}
      role="textbox"
      suppressContentEditableWarning={suppressContentEditableWarning ?? editable}
    >
      {renderedDocument.children?.map((child) =>
        createRenderedElement(child, blockSelection),
      )}
    </div>
  );
}
