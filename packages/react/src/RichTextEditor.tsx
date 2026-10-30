import {
  applyTransaction,
  applyModelSelectionToDom,
  createDefaultCommandRegistry,
  DEFAULT_CLIPBOARD_PARSERS,
  createDocument,
  createMarkdownInputRuleResult,
  createBackspaceInputTransaction,
  createBlockSelection,
  createCellSelection,
  createCompositionState,
  createDeleteInputTransaction,
  createSelectionAfterBackspaceInput,
  createSelectionAfterDeleteInput,
  createSelectionAfterTabInput,
  createSetTaskItemCheckedOperation,
  createTabInputTransaction,
  createTransaction,
  cancelComposition,
  canExecuteCommand,
  DELETE_SELECTION_COMMAND_NAME,
  DELETE_IMAGE_COMMAND_NAME,
  domSelectionToModelSelection,
  executeCommand as executeCoreCommand,
  finishComposition,
  getNodeAtPath,
  getClipboardText,
  getClipboardHtml,
  getAdjacentCellSelection,
  getEditorShortcutAction,
  getElementModelPath,
  INSERT_TEXT_COMMAND_NAME,
  isCollapsed,
  isValidPoint,
  isTextNode,
  MERGE_BLOCK_COMMAND_NAME,
  parseClipboardData,
  PASTE_COMMAND_NAME,
  renderDocument,
  startComposition,
  updateComposition,
  SPLIT_BLOCK_COMMAND_NAME,
  type CommandResult,
  type CommandName,
  type CommandRegistry,
  type BlockSelection,
  type CellSelection,
  type CompositionState,
  type DocumentNode,
  type RangeSelection,
  type RenderedElementNode,
  type Transaction,
} from "@crucialy-rich/core";
import {
  createElement,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ClipboardEvent,
  type CompositionEvent,
  type ForwardedRef,
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
    | "onCopy"
    | "onCut"
    | "onCompositionEnd"
    | "onCompositionStart"
    | "onCompositionUpdate"
    | "onKeyDown"
    | "onKeyUp"
    | "onMouseUp"
    | "onPaste"
    | "suppressContentEditableWarning"
  > {
  defaultValue?: DocumentNode;
  blockSelection?: BlockSelection;
  cellSelection?: CellSelection;
  clipboardFormat?: "plain" | "html";
  commandRegistry?: CommandRegistry;
  label?: string;
  onBlockSelectionChange?: (selection: BlockSelection | undefined) => void;
  onCellSelectionChange?: (selection: CellSelection | undefined) => void;
  onChange?: (value: DocumentNode) => void;
  onCompositionStateChange?: (state: CompositionState) => void;
  onSelectionChange?: (selection: RangeSelection) => void;
  onTransaction?: (event: RichTextEditorTransactionEvent) => void;
  selection?: RangeSelection;
  value?: DocumentNode;
}

export interface RichTextEditorHandle {
  executeCommand: (name: CommandName, payload?: unknown) => CommandResult;
  focus: (options?: FocusOptions) => void;
  getDocument: () => DocumentNode;
  getElement: () => HTMLDivElement | null;
  getSelection: () => RangeSelection | undefined;
}

export type RichTextEditorInputType =
  | "command"
  | "deleteBackward"
  | "deleteByCut"
  | "deleteImage"
  | "deleteForward"
  | "insertParagraph"
  | "insertFromPaste"
  | "insertFromInputRule"
  | "insertCompositionText"
  | "insertText"
  | "indentListItem"
  | "formatShortcut"
  | "outdentListItem"
  | "setTaskItemChecked";

export interface RichTextEditorTransactionEvent {
  after: DocumentNode;
  batch?: string;
  before: DocumentNode;
  beforeSelection?: RangeSelection;
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
  cellSelection?: CellSelection,
): ReactElement {
  const children =
    node.children?.map((child) =>
      createRenderedElement(child, blockSelection, cellSelection),
    ) ?? node.text;
  const blockSelected =
    node.tagName === "img" &&
    blockSelection !== undefined &&
    arePathsEqual(node.path, blockSelection.path);
  const cellSelected =
    node.tagName === "td" &&
    cellSelection !== undefined &&
    arePathsEqual(node.path, cellSelection.path);

  return createElement(
    node.tagName,
    {
      ...node.attributes,
      key: node.path.join(".") || "root",
      ...(blockSelected || cellSelected ? { "data-selected": "true" } : {}),
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

const defaultCommandRegistry = createDefaultCommandRegistry();

interface KeyboardInputResult {
  batch?: string;
  beforeSelection?: RangeSelection;
  inputType: RichTextEditorInputType;
  selection: RangeSelection;
  transaction: Transaction;
}

function createKeyboardInputResultFromCommandResult(
  result: CommandResult,
  beforeSelection: RangeSelection | undefined,
  inputType: KeyboardInputResult["inputType"],
  batch?: string,
): KeyboardInputResult | undefined {
  if (!result.ok || !result.selection || !result.transaction) {
    return undefined;
  }

  const inputResult: KeyboardInputResult = {
    ...(beforeSelection ? { beforeSelection } : {}),
    inputType,
    selection: result.selection,
    transaction: result.transaction,
  };

  return batch ? { ...inputResult, batch } : inputResult;
}

function getModelSelectionFromDom(root: HTMLDivElement, document: DocumentNode) {
  const domSelection = root.ownerDocument.getSelection();

  return domSelection &&
    root.contains(domSelection.anchorNode) &&
    root.contains(domSelection.focusNode)
    ? domSelectionToModelSelection(document, domSelection)
    : undefined;
}

function writeClipboardData(
  event: ClipboardEvent<HTMLDivElement>,
  text: string,
  html?: string,
) {
  event.preventDefault();
  try {
    event.clipboardData.clearData();
    event.clipboardData.setData("text/plain", text);
    if (html !== undefined) event.clipboardData.setData("text/html", html);
    return true;
  } catch {
    return false;
  }
}

function ownsBlockClipboardSelection(root: HTMLDivElement): boolean {
  if (root.ownerDocument.activeElement !== root) return false;
  const selection = root.ownerDocument.getSelection();
  return (
    !selection?.rangeCount ||
    (root.contains(selection.anchorNode) && root.contains(selection.focusNode))
  );
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
  registry: CommandRegistry,
  document: DocumentNode,
  selection: RangeSelection,
  text: string,
  inputType: KeyboardInputResult["inputType"] = "insertText",
  batch = "typing",
): KeyboardInputResult | undefined {
  const result = executeCoreCommand(registry, INSERT_TEXT_COMMAND_NAME, {
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
    inputType,
    batch,
  );
}

function createDeleteSelectionCommandResult(
  registry: CommandRegistry,
  document: DocumentNode,
  selection: RangeSelection,
  inputType: KeyboardInputResult["inputType"],
): KeyboardInputResult | undefined {
  const result = executeCoreCommand(registry, DELETE_SELECTION_COMMAND_NAME, {
    context: {
      document,
      selection,
    },
  });

  return createKeyboardInputResultFromCommandResult(result, selection, inputType);
}

function createDeleteImageCommandResult(
  registry: CommandRegistry,
  document: DocumentNode,
  blockSelection: BlockSelection,
  beforeSelection?: RangeSelection,
): KeyboardInputResult | undefined {
  const result = executeCoreCommand(registry, DELETE_IMAGE_COMMAND_NAME, {
    context: { document },
    payload: { selection: blockSelection },
  });

  return result.selection
    ? createKeyboardInputResultFromCommandResult(
        result,
        beforeSelection &&
          isValidPoint(document, beforeSelection.anchor) &&
          isValidPoint(document, beforeSelection.focus)
          ? beforeSelection
          : undefined,
        "deleteImage",
      )
    : undefined;
}

function createSplitBlockCommandResult(
  registry: CommandRegistry,
  document: DocumentNode,
  selection: RangeSelection,
): KeyboardInputResult | undefined {
  const result = executeCoreCommand(registry, SPLIT_BLOCK_COMMAND_NAME, {
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
  registry: CommandRegistry,
  document: DocumentNode,
  selection: RangeSelection,
  inputType: KeyboardInputResult["inputType"] = "deleteBackward",
): KeyboardInputResult | undefined {
  const result = executeCoreCommand(registry, MERGE_BLOCK_COMMAND_NAME, {
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
  registry: CommandRegistry,
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
    point.path.length !== 2 ||
    blockIndex === undefined ||
    blockIndex >= document.children.length - 1 ||
    !isTextNode(node) ||
    point.offset !== node.text.length
  ) {
    return undefined;
  }

  return createMergeBlockCommandResult(
    registry,
    document,
    createCollapsedSelection({
      path: [blockIndex + 1, 0],
      offset: 0,
    }),
    "deleteForward",
  );
}

function RichTextEditorComponent(
  {
    blockSelection,
    cellSelection,
    clipboardFormat = "plain",
    className,
    commandRegistry,
    contentEditable,
    defaultValue,
    label = "Rich text editor",
    onBeforeInput,
    onBlockSelectionChange,
    onCellSelectionChange,
    onClick,
    onCopy,
    onCut,
    onCompositionEnd,
    onCompositionStart,
    onCompositionStateChange,
    onCompositionUpdate,
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
  }: RichTextEditorProps,
  forwardedRef: ForwardedRef<RichTextEditorHandle>,
): ReactElement {
  const rootRef = useRef<HTMLDivElement>(null);
  const compositionRef = useRef<CompositionState>(createCompositionState());
  const [compositionActive, setCompositionActive] = useState(false);
  const [uncontrolledDocument, setUncontrolledDocument] = useState(
    () => defaultValue ?? createDocument(),
  );
  const controlled = value !== undefined;
  const document = value ?? uncontrolledDocument;
  const registry = commandRegistry ?? defaultCommandRegistry;
  const renderedDocument = useMemo(() => renderDocument(document), [document]);
  const editable = isEditableContent(contentEditable);

  useImperativeHandle(
    forwardedRef,
    () => ({
      focus(options) {
        rootRef.current?.focus(options);
      },
      executeCommand(name, payload) {
        const currentSelection = rootRef.current
          ? (getModelSelectionFromDom(rootRef.current, document) ?? selection)
          : selection;
        const result = executeCoreCommand(registry, name, {
          context: currentSelection
            ? { document, selection: currentSelection }
            : { document },
          ...(payload === undefined ? {} : { payload }),
        });

        if (currentSelection && result.transaction && result.selection) {
          const input = createKeyboardInputResultFromCommandResult(
            result,
            currentSelection,
            "command",
          );

          if (input) {
            commitInputResult(input);
          }
        }

        return result;
      },
      getDocument() {
        return document;
      },
      getElement() {
        return rootRef.current;
      },
      getSelection() {
        return rootRef.current
          ? (getModelSelectionFromDom(rootRef.current, document) ?? selection)
          : selection;
      },
    }),
    [
      controlled,
      document,
      onChange,
      onSelectionChange,
      onTransaction,
      registry,
      selection,
    ],
  );

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

  function publishCompositionState(nextState: CompositionState) {
    compositionRef.current = nextState;
    setCompositionActive(nextState.active);
    onCompositionStateChange?.(nextState);
  }

  function commitInputResult(input: KeyboardInputResult) {
    if (input.transaction.operations.length > 0) {
      const nextDocument = applyTransaction(document, input.transaction);

      commitDocumentChange(nextDocument);
      const transactionEvent: RichTextEditorTransactionEvent = {
        after: nextDocument,
        before: document,
        ...(input.beforeSelection ? { beforeSelection: input.beforeSelection } : {}),
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

    if (
      event.defaultPrevented ||
      !editable ||
      compositionRef.current.active ||
      (event.nativeEvent as InputEvent).isComposing
    ) {
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

    const inputRuleResult = createMarkdownInputRuleResult({
      data,
      document,
      selection: modelSelection,
    });

    if (inputRuleResult) {
      event.preventDefault();
      commitInputResult({
        beforeSelection: modelSelection,
        inputType: "insertFromInputRule",
        selection: inputRuleResult.selection,
        transaction: inputRuleResult.transaction,
      });
      return;
    }

    const input = createInsertTextCommandResult(
      registry,
      document,
      modelSelection,
      data,
    );

    event.preventDefault();

    if (input) {
      commitInputResult(input);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);

    if (
      event.defaultPrevented ||
      !editable ||
      compositionRef.current.active ||
      event.nativeEvent.isComposing
    ) {
      return;
    }

    const shortcutAction = getEditorShortcutAction(event.nativeEvent);

    if (shortcutAction?.type === "command") {
      const shortcutSelection = getModelSelectionFromDom(event.currentTarget, document);
      const result = shortcutSelection
        ? executeCoreCommand(registry, shortcutAction.commandName, {
            context: { document, selection: shortcutSelection },
            ...(shortcutAction.payload === undefined
              ? {}
              : { payload: shortcutAction.payload }),
          })
        : undefined;
      const shortcutInput =
        result && shortcutSelection
          ? createKeyboardInputResultFromCommandResult(
              result,
              shortcutSelection,
              "formatShortcut",
            )
          : undefined;

      if (shortcutInput) {
        event.preventDefault();
        commitInputResult(shortcutInput);
        return;
      }
    }

    if (blockSelection && (event.key === "Backspace" || event.key === "Delete")) {
      const deleteImageInput = createDeleteImageCommandResult(
        registry,
        document,
        blockSelection,
        getModelSelectionFromDom(event.currentTarget, document) ?? selection,
      );

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

    if (event.key === "Tab" && !event.altKey && !event.ctrlKey && !event.metaKey) {
      const nextSelection = getAdjacentCellSelection(
        document,
        modelSelection,
        event.shiftKey ? "previous" : "next",
      );

      if (
        nextSelection &&
        applyModelSelectionToDom(event.currentTarget, document, nextSelection)
      ) {
        event.preventDefault();
        onSelectionChange?.(nextSelection);
        onBlockSelectionChange?.(undefined);
        onCellSelectionChange?.(
          createCellSelection(nextSelection.anchor.path.slice(0, 3)),
        );
        return;
      }
    }

    if (event.key === "Enter") {
      const splitBlockInput = createSplitBlockCommandResult(
        registry,
        document,
        modelSelection,
      );

      if (splitBlockInput) {
        event.preventDefault();
        commitInputResult(splitBlockInput);

        return;
      }
    }

    if (event.key === "Backspace" || event.key === "Delete") {
      const deleteSelectionInput = createDeleteSelectionCommandResult(
        registry,
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
      const mergeBlockInput = createMergeBlockCommandResult(
        registry,
        document,
        modelSelection,
      );

      if (mergeBlockInput) {
        event.preventDefault();
        commitInputResult(mergeBlockInput);

        return;
      }
    }

    if (event.key === "Delete") {
      const mergeNextBlockInput = createMergeNextBlockCommandResult(
        registry,
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

  function handleCopy(event: ClipboardEvent<HTMLDivElement>) {
    onCopy?.(event);
    if (event.defaultPrevented || compositionRef.current.active) return;
    if (blockSelection) {
      if (!ownsBlockClipboardSelection(event.currentTarget)) return;
      event.preventDefault();
      if (clipboardFormat === "html") {
        const html = getClipboardHtml(document, blockSelection);
        if (html !== undefined) writeClipboardData(event, "", html);
      }
      return;
    }
    const modelSelection = getModelSelectionFromDom(event.currentTarget, document);
    const text = modelSelection
      ? getClipboardText(document, modelSelection)
      : undefined;
    if (text !== undefined && modelSelection) {
      writeClipboardData(
        event,
        text,
        clipboardFormat === "html"
          ? getClipboardHtml(document, modelSelection)
          : undefined,
      );
    }
  }

  function handleCut(event: ClipboardEvent<HTMLDivElement>) {
    onCut?.(event);
    if (event.defaultPrevented || !editable) return;
    event.preventDefault();
    if (compositionRef.current.active) return;
    if (blockSelection) {
      if (
        clipboardFormat !== "html" ||
        !ownsBlockClipboardSelection(event.currentTarget)
      )
        return;
      const html = getClipboardHtml(document, blockSelection);
      if (html === undefined) return;
      const input = createDeleteImageCommandResult(
        registry,
        document,
        blockSelection,
        getModelSelectionFromDom(event.currentTarget, document) ?? selection,
      );
      if (
        input &&
        input.transaction.operations.length > 0 &&
        writeClipboardData(event, "", html)
      ) {
        commitInputResult({
          ...input,
          inputType: "deleteByCut",
        });
        onBlockSelectionChange?.(undefined);
      }
      return;
    }
    const modelSelection = getModelSelectionFromDom(event.currentTarget, document);
    if (!modelSelection) return;
    const text = getClipboardText(document, modelSelection);
    if (text === undefined) return;
    const input = createDeleteSelectionCommandResult(
      registry,
      document,
      modelSelection,
      "deleteByCut",
    );
    if (
      input &&
      input.transaction.operations.length > 0 &&
      writeClipboardData(
        event,
        text,
        clipboardFormat === "html"
          ? getClipboardHtml(document, modelSelection)
          : undefined,
      )
    ) {
      commitInputResult(input);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    onPaste?.(event);

    if (event.defaultPrevented || !editable) {
      return;
    }

    event.preventDefault();

    if (compositionRef.current.active) {
      return;
    }

    const modelSelection = getModelSelectionFromDom(event.currentTarget, document);
    if (!modelSelection) {
      return;
    }
    const context = { document, selection: modelSelection };
    const fragment = parseClipboardData(
      {
        getData: (mimeType) => event.clipboardData.getData(mimeType),
        types: Array.from(event.clipboardData.types),
      },
      DEFAULT_CLIPBOARD_PARSERS,
      (candidate) =>
        canExecuteCommand(registry, PASTE_COMMAND_NAME, {
          context,
          payload: { fragment: candidate },
        }),
    );

    if (!fragment) {
      return;
    }

    const result = executeCoreCommand(registry, PASTE_COMMAND_NAME, {
      context,
      payload: { fragment },
    });
    const input = createKeyboardInputResultFromCommandResult(
      result,
      modelSelection,
      "insertFromPaste",
    );

    if (input) {
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

    const tableCell = event.target.closest<HTMLTableCellElement>(
      'td[data-crucialy-table-cell="true"]',
    );

    if (tableCell && event.currentTarget.contains(tableCell)) {
      const cellPath = getElementModelPath(tableCell);

      if (cellPath) {
        onCellSelectionChange?.(createCellSelection(cellPath));
      }
    } else {
      onCellSelectionChange?.(undefined);
    }

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

  function handleCompositionStart(event: CompositionEvent<HTMLDivElement>) {
    onCompositionStart?.(event);

    if (event.defaultPrevented || !editable) {
      return;
    }

    const modelSelection = getModelSelectionFromDom(event.currentTarget, document);

    if (modelSelection) {
      publishCompositionState(startComposition(modelSelection));
    }
  }

  function handleCompositionUpdate(event: CompositionEvent<HTMLDivElement>) {
    onCompositionUpdate?.(event);

    if (!compositionRef.current.active) {
      return;
    }

    const modelSelection = getModelSelectionFromDom(event.currentTarget, document);

    publishCompositionState(
      updateComposition(compositionRef.current, event.data, modelSelection),
    );
  }

  function handleCompositionEnd(event: CompositionEvent<HTMLDivElement>) {
    onCompositionEnd?.(event);

    const commit = finishComposition(compositionRef.current, event.data);

    publishCompositionState(cancelComposition());

    if (!editable || !commit) {
      return;
    }

    const input = createInsertTextCommandResult(
      registry,
      document,
      commit.selection,
      commit.data,
      "insertCompositionText",
      "composition",
    );

    if (input) {
      commitInputResult(input);
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
      data-composing={compositionActive ? "true" : "false"}
      data-crucialy-rich-editor="true"
      onBeforeInput={handleBeforeInput}
      onClick={handleClick}
      onCopy={handleCopy}
      onCut={handleCut}
      onCompositionEnd={handleCompositionEnd}
      onCompositionStart={handleCompositionStart}
      onCompositionUpdate={handleCompositionUpdate}
      onKeyDown={handleKeyDown}
      onKeyUp={onKeyUp}
      onMouseUp={onMouseUp}
      onPaste={handlePaste}
      role="textbox"
      suppressContentEditableWarning={suppressContentEditableWarning ?? editable}
    >
      {renderedDocument.children?.map((child) =>
        createRenderedElement(child, blockSelection, cellSelection),
      )}
    </div>
  );
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  RichTextEditorComponent,
);

RichTextEditor.displayName = "RichTextEditor";
