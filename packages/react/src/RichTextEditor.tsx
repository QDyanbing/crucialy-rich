import {
  applyTransaction,
  createDocument,
  createInsertTextInputTransaction,
  domSelectionToModelSelection,
  renderDocument,
  type DocumentNode,
  type RenderedElementNode,
} from "@crucialy-rich/core";
import {
  createElement,
  useMemo,
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

export function RichTextEditor({
  className,
  contentEditable,
  defaultValue,
  label = "Rich text editor",
  onBeforeInput,
  onKeyUp,
  onMouseUp,
  onChange,
  suppressContentEditableWarning,
  value,
}: RichTextEditorProps): ReactElement {
  const [uncontrolledDocument, setUncontrolledDocument] = useState(
    () => defaultValue ?? createDocument(),
  );
  const controlled = value !== undefined;
  const document = value ?? uncontrolledDocument;
  const renderedDocument = useMemo(() => renderDocument(document), [document]);
  const editable = isEditableContent(contentEditable);

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

    const nativeEvent = event.nativeEvent as InputEvent;

    if (nativeEvent.inputType !== "insertText" || !nativeEvent.data) {
      return;
    }

    const domSelection = event.currentTarget.ownerDocument.getSelection();
    const modelSelection = domSelection
      ? domSelectionToModelSelection(document, domSelection)
      : undefined;

    if (!modelSelection) {
      return;
    }

    event.preventDefault();
    commitDocumentChange(
      applyTransaction(
        document,
        createInsertTextInputTransaction({
          data: nativeEvent.data,
          selection: modelSelection,
        }),
      ),
    );
  }

  return (
    <div
      {...renderedDocument.attributes}
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
