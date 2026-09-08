import { isCollapsed, type RangeSelection } from "@crucialy-rich/core";

export interface FloatingToolbarAnchorRect {
  bottom: number;
  height: number;
  left: number;
  top: number;
  width: number;
}

export interface FloatingToolbarSize {
  height: number;
  width: number;
}

export interface FloatingToolbarViewport {
  height: number;
  width: number;
}

export interface FloatingToolbarPosition {
  left: number;
  top: number;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

export function isFloatingToolbarVisible(selection?: RangeSelection): boolean {
  return selection !== undefined && !isCollapsed(selection);
}

export function calculateFloatingToolbarPosition(
  anchor: FloatingToolbarAnchorRect,
  toolbar: FloatingToolbarSize,
  viewport: FloatingToolbarViewport,
  gap = 8,
  margin = 8,
): FloatingToolbarPosition {
  const left = clamp(
    anchor.left + anchor.width / 2 - toolbar.width / 2,
    margin,
    viewport.width - toolbar.width - margin,
  );
  const topAbove = anchor.top - toolbar.height - gap;
  const top =
    topAbove >= margin
      ? topAbove
      : clamp(anchor.bottom + gap, margin, viewport.height - toolbar.height - margin);

  return { left, top };
}
