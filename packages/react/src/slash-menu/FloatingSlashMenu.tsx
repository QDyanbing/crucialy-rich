import type { ReactElement } from "react";
import { useEffect, useRef } from "react";

import { calculateSlashMenuPosition } from "./position";
import { SlashMenu, type SlashMenuProps } from "./SlashMenu";
import type { SlashMenuAnchorRect, SlashMenuSize, SlashMenuViewport } from "./types";

const defaultMenuSize: SlashMenuSize = { height: 320, width: 280 };
const serverViewport: SlashMenuViewport = { height: 768, width: 1024 };

export interface FloatingSlashMenuProps extends SlashMenuProps {
  anchorRect?: SlashMenuAnchorRect | null;
  menuSize?: SlashMenuSize;
  viewport?: SlashMenuViewport;
}

function getViewport(): SlashMenuViewport {
  return typeof window === "undefined"
    ? serverViewport
    : { height: window.innerHeight, width: window.innerWidth };
}

export function FloatingSlashMenu({
  activeIndex = 0,
  anchorRect,
  items,
  menuSize = defaultMenuSize,
  viewport = getViewport(),
  ...menuProps
}: FloatingSlashMenuProps): ReactElement | null {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (
      !root ||
      !Number.isInteger(activeIndex) ||
      activeIndex < 0 ||
      root.clientHeight <= 0
    )
      return;
    const item = root.querySelectorAll<HTMLElement>('[role="option"]')[activeIndex];
    if (!item) return;
    const bounds = root.getBoundingClientRect();
    const option = item.getBoundingClientRect();
    const top = bounds.top + root.clientTop;
    const bottom = top + root.clientHeight;
    const delta =
      option.top < top || option.height > root.clientHeight
        ? option.top - top
        : option.bottom > bottom
          ? option.bottom - bottom
          : 0;
    if (delta !== 0) root.scrollTop = Math.max(0, root.scrollTop + delta);
  }, [
    activeIndex,
    items,
    anchorRect,
    menuSize.height,
    menuSize.width,
    viewport.height,
    viewport.width,
  ]);

  if (
    !anchorRect ||
    items.length === 0 ||
    ![
      anchorRect.top,
      anchorRect.bottom,
      anchorRect.left,
      menuSize.width,
      menuSize.height,
      viewport.width,
      viewport.height,
    ].every(Number.isFinite) ||
    anchorRect.bottom < anchorRect.top ||
    menuSize.width <= 0 ||
    menuSize.height <= 0 ||
    viewport.width <= 16 ||
    viewport.height <= 16
  ) {
    return null;
  }

  const fittedSize = {
    ...menuSize,
    height: Math.min(menuSize.height, Math.max(0, viewport.height - 16)),
    width: Math.min(menuSize.width, Math.max(0, viewport.width - 16)),
  };
  const position = calculateSlashMenuPosition(anchorRect, fittedSize, viewport);

  return (
    <div
      ref={rootRef}
      className="crucialy-floating-slash-menu"
      data-placement={position.placement}
      style={{
        left: position.left,
        maxHeight: fittedSize.height,
        overflowY: "auto",
        position: "fixed",
        top: position.top,
        width: fittedSize.width,
        zIndex: 1000,
      }}
    >
      <SlashMenu activeIndex={activeIndex} items={items} {...menuProps} />
    </div>
  );
}
