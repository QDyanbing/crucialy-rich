import type { MouseEvent, PointerEvent, ReactElement } from "react";

import type { SlashCommandItem } from "./types";

export interface SlashMenuProps {
  activeIndex?: number;
  className?: string;
  items: readonly SlashCommandItem[];
  label?: string;
  onSelect?: (item: SlashCommandItem) => void;
}

function joinClassNames(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

export function SlashMenu({
  activeIndex = 0,
  className,
  items,
  label = "斜杠菜单",
  onSelect,
}: SlashMenuProps): ReactElement {
  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>, item: SlashCommandItem) {
    event.preventDefault();
    onSelect?.(item);
  }

  return (
    <div
      aria-label={label}
      className={joinClassNames("crucialy-slash-menu", className)}
      role="listbox"
    >
      {items.map((item, index) => (
        <button
          aria-selected={index === activeIndex}
          className="crucialy-slash-menu__item"
          data-command={item.commandName}
          id={`crucialy-slash-menu-${item.id}`}
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
