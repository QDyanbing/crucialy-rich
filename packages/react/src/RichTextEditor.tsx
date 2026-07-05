import {
  createDocument,
  renderDocument,
  type DocumentNode,
  type RenderedElementNode,
} from "@crucialy-rich/core";
import {
  createElement,
  useMemo,
  useState,
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
  suppressContentEditableWarning,
  value,
}: RichTextEditorProps): ReactElement {
  const [uncontrolledDocument] = useState(() => defaultValue ?? createDocument());
  const document = value ?? uncontrolledDocument;
  const renderedDocument = useMemo(() => renderDocument(document), [document]);
  const editable = isEditableContent(contentEditable);

  return (
    <div
      {...renderedDocument.attributes}
      aria-label={label}
      aria-readonly={editable ? "false" : "true"}
      className={className}
      contentEditable={contentEditable}
      data-crucialy-rich-editor="true"
      onBeforeInput={onBeforeInput}
      onKeyUp={onKeyUp}
      onMouseUp={onMouseUp}
      role="textbox"
      suppressContentEditableWarning={suppressContentEditableWarning}
    >
      {renderedDocument.children?.map(createRenderedElement)}
    </div>
  );
}
