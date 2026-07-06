import {
  applyTransaction,
  applyModelSelectionToDom,
  createDocument,
  createBackspaceInputTransaction,
  createInsertTextInputTransaction,
  createSelectionAfterBackspaceInput,
  createSelectionAfterInsertTextInput,
  domSelectionToModelSelection,
  renderDocument,
  type DocumentNode,
  type RangeSelection,
  type RenderedElementNode,
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

  function handleBeforeInput(event: FormEvent<HTMLDivElement>) {
    onBeforeInput?.(event);

    if (event.defaultPrevented || !editable) {
      return;
    }

    const data = getInsertTextInputData(event.nativeEvent);

    if (!data) {
      return;
    }

    const domSelection = event.currentTarget.ownerDocument.getSelection();
    const modelSelection = domSelection
      ? domSelectionToModelSelection(document, domSelection)
      : undefined;

    if (!modelSelection) {
      return;
    }

    const input = {
      data,
      selection: modelSelection,
    };

    event.preventDefault();
    commitDocumentChange(
      applyTransaction(document, createInsertTextInputTransaction(input)),
    );
    onSelectionChange?.(createSelectionAfterInsertTextInput(input));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);

    if (event.defaultPrevented || !editable || event.key !== "Backspace") {
      return;
    }

    const domSelection = event.currentTarget.ownerDocument.getSelection();
    const modelSelection = domSelection
      ? domSelectionToModelSelection(document, domSelection)
      : undefined;

    if (!modelSelection) {
      return;
    }

    const input = {
      document,
      selection: modelSelection,
    };
    const transaction = createBackspaceInputTransaction(input);

    event.preventDefault();

    if (transaction.operations.length > 0) {
      commitDocumentChange(applyTransaction(document, transaction));
    }

    onSelectionChange?.(createSelectionAfterBackspaceInput(input));
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
