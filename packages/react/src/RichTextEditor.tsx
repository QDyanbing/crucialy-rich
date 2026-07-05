import {
  applyTransaction,
  applyModelSelectionToDom,
  createDocument,
  createInsertTextInputTransaction,
  createSelectionAfterInsertTextInput,
  domSelectionToModelSelection,
  renderDocument,
  type DocumentNode,
  type RangeSelection,
  type RenderedElementNode,
} from "@crucialy-rich/core";
import {
  createElement,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type HTMLAttributes,
  type ReactElement,
} from "react";

export interface RichTextEditorProps
  extends Pick<
    HTMLAttributes<HTMLDivElement>,
    | "className"
    | "contentEditable"
    | "onBeforeInput"
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

export function RichTextEditor({
  className,
  contentEditable,
  defaultValue,
  label = "Rich text editor",
  onBeforeInput,
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

  useLayoutEffect(() => {
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
      onKeyUp={onKeyUp}
      onMouseUp={onMouseUp}
      role="textbox"
      suppressContentEditableWarning={suppressContentEditableWarning}
    >
      {renderedDocument.children?.map(createRenderedElement)}
    </div>
  );
}
