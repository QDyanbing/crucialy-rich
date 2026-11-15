import type { KeyboardEvent, MouseEvent, PointerEvent, ReactElement } from "react";
import { useRef, useState } from "react";

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
  const [focusedId, setFocusedId] = useState<string>();
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());
  const enabledItems = disabled
    ? []
    : items.filter(
        (item): item is ResolvedToolbarCommandItem =>
          item.type === "command" && !item.state.disabled,
      );
  const tabStopId = enabledItems.some((item) => item.id === focusedId)
    ? focusedId
    : enabledItems[0]?.id;

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    item: ResolvedToolbarCommandItem,
  ) {
    if (
      event.defaultPrevented ||
      disabled ||
      item.state.disabled ||
      enabledItems.length === 0
    )
      return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const current = enabledItems.findIndex((candidate) => candidate.id === item.id);
    if (current < 0) return;
    const step = event.key === "ArrowRight" ? 1 : -1;
    const next =
      enabledItems[(current + step + enabledItems.length) % enabledItems.length]!;
    event.preventDefault();
    buttonRefs.current.get(next.id)?.focus();
  }

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
    if (event.defaultPrevented) {
      onCommandCancel?.(item);
      return;
    }
    if (
      disabled ||
      item.state.disabled ||
      event.button !== 0 ||
      event.isPrimary === false
    )
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
            ref={(button) => {
              if (button) buttonRefs.current.set(item.id, button);
              else buttonRefs.current.delete(item.id);
            }}
            tabIndex={item.id === tabStopId ? 0 : -1}
            onFocus={() => setFocusedId(item.id)}
            onKeyDown={(event) => handleKeyDown(event, item)}
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
