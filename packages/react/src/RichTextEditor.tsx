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

export function RichTextEditor({
  className,
  contentEditable,
  defaultValue,
  label = "Rich text editor",
  onKeyUp,
  onMouseUp,
  suppressContentEditableWarning,
  value,
}: RichTextEditorProps): ReactElement {
  const [uncontrolledDocument] = useState(() => defaultValue ?? createDocument());
  const document = value ?? uncontrolledDocument;
  const renderedDocument = useMemo(() => renderDocument(document), [document]);

  return (
    <div
      {...renderedDocument.attributes}
      aria-label={label}
      aria-readonly="true"
      className={className}
      contentEditable={contentEditable}
      data-crucialy-rich-editor="true"
      onKeyUp={onKeyUp}
      onMouseUp={onMouseUp}
      role="textbox"
      suppressContentEditableWarning={suppressContentEditableWarning}
    >
      {renderedDocument.children?.map(createRenderedElement)}
    </div>
  );
}
