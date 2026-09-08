import type { MouseEvent, ReactElement } from "react";

import type { ResolvedToolbarCommandItem, ResolvedToolbarItem } from "./types";

export interface ToolbarProps {
  className?: string;
  items: readonly ResolvedToolbarItem[];
  label?: string;
  onCommand?: (item: ResolvedToolbarCommandItem) => void;
}

function joinClassNames(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

export function Toolbar({
  className,
  items,
  label = "富文本工具栏",
  onCommand,
}: ToolbarProps): ReactElement {
  function handleCommandClick(
    event: MouseEvent<HTMLButtonElement>,
    item: ResolvedToolbarCommandItem,
  ) {
    event.preventDefault();
    onCommand?.(item);
  }

  return (
    <div
      aria-label={label}
      className={joinClassNames("crucialy-toolbar", className)}
      role="toolbar"
    >
      {items.map((item) =>
        item.type === "separator" ? (
          <span
            aria-orientation="vertical"
            className="crucialy-toolbar__separator"
            key={item.id}
            role="separator"
          />
        ) : (
          <button
            aria-label={item.label}
            aria-pressed={item.state.active}
            className="crucialy-toolbar__button"
            data-command={item.commandName}
            data-state={item.state.active ? "active" : "inactive"}
            disabled={item.state.disabled}
            key={item.id}
            title={item.label}
            type="button"
            onClick={(event) => handleCommandClick(event, item)}
          >
            {item.text ?? item.label}
          </button>
        ),
      )}
    </div>
  );
}
