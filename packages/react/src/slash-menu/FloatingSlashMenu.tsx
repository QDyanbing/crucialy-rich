import type { ReactElement } from "react";

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
  anchorRect,
  items,
  menuSize = defaultMenuSize,
  viewport = getViewport(),
  ...menuProps
}: FloatingSlashMenuProps): ReactElement | null {
  if (!anchorRect || items.length === 0) {
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
      className="crucialy-floating-slash-menu"
      data-placement={position.placement}
      style={{
        left: position.left,
        maxHeight: fittedSize.height,
        position: "fixed",
        top: position.top,
        width: fittedSize.width,
        zIndex: 1000,
      }}
    >
      <SlashMenu items={items} {...menuProps} />
    </div>
  );
}
