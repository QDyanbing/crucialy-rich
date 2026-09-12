import type {
  SlashMenuAnchorRect,
  SlashMenuPosition,
  SlashMenuSize,
  SlashMenuViewport,
} from "./types";

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

export function calculateSlashMenuPosition(
  anchor: SlashMenuAnchorRect,
  menu: SlashMenuSize,
  viewport: SlashMenuViewport,
  gap = 6,
  margin = 8,
): SlashMenuPosition {
  const left = clamp(anchor.left, margin, viewport.width - menu.width - margin);
  const topBelow = anchor.bottom + gap;

  if (topBelow + menu.height <= viewport.height - margin) {
    return { left, placement: "below", top: topBelow };
  }

  return {
    left,
    placement: "above",
    top: clamp(anchor.top - menu.height - gap, margin, viewport.height - margin),
  };
}
