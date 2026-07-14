import {
  applyTransaction,
  applyModelSelectionToDom,
  createDefaultCommandRegistry,
  createDocument,
  createBackspaceInputTransaction,
  createDeleteInputTransaction,
  createSelectionAfterBackspaceInput,
  createSelectionAfterDeleteInput,
  DELETE_SELECTION_COMMAND_NAME,
  domSelectionToModelSelection,
  executeCommand,
  INSERT_TEXT_COMMAND_NAME,
  MERGE_BLOCK_COMMAND_NAME,
  renderDocument,
  SPLIT_BLOCK_COMMAND_NAME,
  type CommandResult,
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
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactElement,
} from "react";

export interface RichTextEditorProps
  extends Pick<
    HTMLAttributes<HTMLDivElement>,
    | "className"
    | "contentEditable"
    | "onBeforeInput"
    | "onKeyDown"
    | "onKeyUp"
    | "onMouseUp"
    | "suppressContentEditableWarning"
  > {
  defaultValue?: DocumentNode;
  label?: string;
  onChange?: (value: DocumentNode) => void;
  onSelectionChange?: (selection: RangeSelection) => void;
  selection?: RangeSelection;
  value?: DocumentNode;
}

function createRenderedElement(node: RenderedElementNode): ReactElement {
  const children = node.children?.map(createRenderedElement) ?? node.text;

  return createElement(
    node.tagName,
    {
      ...node.attributes,
      key: node.path.join(".") || "root",
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
  selection: RangeSelection;
  transaction: Transaction;
}

function createKeyboardInputResultFromCommandResult(
  result: CommandResult,
): KeyboardInputResult | undefined {
  return result.ok && result.selection && result.transaction
    ? {
        selection: result.selection,
        transaction: result.transaction,
      }
    : undefined;
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
): KeyboardInputResult | undefined {
  if (key === "Backspace") {
    const input = {
      document,
      selection,
    };

    return {
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

  return createKeyboardInputResultFromCommandResult(result);
}

function createDeleteSelectionCommandResult(
  document: DocumentNode,
  selection: RangeSelection,
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

  return createKeyboardInputResultFromCommandResult(result);
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

  return createKeyboardInputResultFromCommandResult(result);
}

function createMergeBlockCommandResult(
  document: DocumentNode,
  selection: RangeSelection,
): KeyboardInputResult | undefined {
  const result = executeCommand(richTextCommandRegistry, MERGE_BLOCK_COMMAND_NAME, {
    context: {
      document,
      selection,
    },
  });

  return createKeyboardInputResultFromCommandResult(result);
}

export function RichTextEditor({
  className,
  contentEditable,
  defaultValue,
  label = "Rich text editor",
  onBeforeInput,
  onKeyDown,
  onKeyUp,
  onMouseUp,
  onChange,
  onSelectionChange,
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
      commitDocumentChange(applyTransaction(document, input.transaction));
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

    const input = createKeyboardInputResult(event.key, document, modelSelection);

    if (!input) {
      return;
    }

    event.preventDefault();
    commitInputResult(input);
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
      onKeyDown={handleKeyDown}
      onKeyUp={onKeyUp}
      onMouseUp={onMouseUp}
      role="textbox"
      suppressContentEditableWarning={suppressContentEditableWarning ?? editable}
    >
      {renderedDocument.children?.map(createRenderedElement)}
    </div>
  );
}
