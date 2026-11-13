import type { MouseEvent, PointerEvent, ReactElement } from "react";

import type { ResolvedToolbarCommandItem, ResolvedToolbarItem } from "./types";

export interface ToolbarProps {
  className?: string;
  disabled?: boolean;
  items: readonly ResolvedToolbarItem[];
  label?: string;
  onCommand?: (item: ResolvedToolbarCommandItem) => void;
  onCommandPointerDown?: (item: ResolvedToolbarCommandItem) => void;
  onCommandCancel?: (item: ResolvedToolbarCommandItem) => void;
}

function joinClassNames(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

export function Toolbar({
  className,
  disabled = false,
  items,
  label = "富文本工具栏",
  onCommand,
  onCommandPointerDown,
  onCommandCancel,
}: ToolbarProps): ReactElement {
  function handleCommandClick(
    event: MouseEvent<HTMLButtonElement>,
    item: ResolvedToolbarCommandItem,
  ) {
    if (event.defaultPrevented) {
      onCommandCancel?.(item);
      return;
    }
    if (event.button !== 0) return;
    event.preventDefault();
    onCommand?.(item);
  }

  function handleCommandPointerDown(
    event: PointerEvent<HTMLButtonElement>,
    item: ResolvedToolbarCommandItem,
  ) {
    if (event.defaultPrevented || event.button !== 0 || event.isPrimary === false)
      return;
    event.preventDefault();
    onCommandPointerDown?.(item);
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
            disabled={disabled || item.state.disabled}
            key={item.id}
            title={item.label}
            type="button"
            onClick={(event) => handleCommandClick(event, item)}
            onPointerDown={(event) => handleCommandPointerDown(event, item)}
            onPointerCancel={() => onCommandCancel?.(item)}
          >
            {item.text ?? item.label}
          </button>
        ),
      )}
    </div>
  );
}
