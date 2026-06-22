import type { ReactElement } from "react";

export interface RichTextEditorProps {
  className?: string;
  label?: string;
}

export function RichTextEditor({
  className,
  label = "Rich text editor",
}: RichTextEditorProps): ReactElement {
  return (
    <div
      aria-label={label}
      aria-readonly="true"
      className={className}
      data-crucialy-rich-editor="true"
      role="textbox"
    >
      Editor shell
    </div>
  );
}
