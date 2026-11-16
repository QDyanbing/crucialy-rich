import type { MouseEvent, PointerEvent, ReactElement } from "react";
import { useId } from "react";

import type { SlashCommandItem } from "./types";

export interface SlashMenuProps {
  activeIndex?: number;
  className?: string;
  disabled?: boolean;
  items: readonly SlashCommandItem[];
  label?: string;
  onSelect?: (item: SlashCommandItem) => void;
}

function joinClassNames(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

function ownsButtonTarget(target: EventTarget, button: HTMLButtonElement): boolean {
  return (
    target instanceof Element &&
    target.closest("button") === button &&
    !target.closest('input, textarea, select, [contenteditable="true"]')
  );
}

export function SlashMenu({
  activeIndex = 0,
  className,
  disabled = false,
  items,
  label = "斜杠菜单",
  onSelect,
}: SlashMenuProps): ReactElement {
  const menuId = useId();

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.defaultPrevented || disabled) return;
    if (
      event.button !== 0 ||
      event.isPrimary === false ||
      !ownsButtonTarget(event.target, event.currentTarget)
    )
      return;
    event.preventDefault();
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>, item: SlashCommandItem) {
    if (event.defaultPrevented || disabled) return;
    if (event.button !== 0 || !ownsButtonTarget(event.target, event.currentTarget))
      return;
    event.preventDefault();
    onSelect?.(item);
  }

  return (
    <div
      aria-label={label}
      aria-disabled={disabled || undefined}
      className={joinClassNames("crucialy-slash-menu", className)}
      role="listbox"
    >
      {items.map((item, index) => (
        <button
          aria-selected={index === activeIndex}
          aria-disabled={disabled || undefined}
          disabled={disabled}
          className="crucialy-slash-menu__item"
          data-command={item.commandName}
          id={`crucialy-slash-menu-${menuId}-${index}`}
          key={item.id}
          role="option"
          type="button"
          onClick={(event) => handleClick(event, item)}
          onPointerDown={handlePointerDown}
        >
          <span className="crucialy-slash-menu__label">{item.label}</span>
          {item.description ? (
            <span className="crucialy-slash-menu__description">{item.description}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
