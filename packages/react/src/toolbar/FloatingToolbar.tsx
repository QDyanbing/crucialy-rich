import type { ReactElement } from "react";

import { FixedToolbar, type FixedToolbarProps } from "./FixedToolbar";
import {
  calculateFloatingToolbarPosition,
  isFloatingToolbarVisible,
  type FloatingToolbarAnchorRect,
  type FloatingToolbarSize,
  type FloatingToolbarViewport,
} from "./floating";

const defaultToolbarSize: FloatingToolbarSize = { height: 40, width: 320 };
const serverViewport: FloatingToolbarViewport = { height: 768, width: 1024 };

export interface FloatingToolbarProps extends FixedToolbarProps {
  anchorRect?: FloatingToolbarAnchorRect | null;
  toolbarSize?: FloatingToolbarSize;
  viewport?: FloatingToolbarViewport;
}

function getViewport(): FloatingToolbarViewport {
  return typeof window === "undefined"
    ? serverViewport
    : { height: window.innerHeight, width: window.innerWidth };
}

export function FloatingToolbar({
  anchorRect,
  toolbarSize = defaultToolbarSize,
  viewport = getViewport(),
  ...toolbarProps
}: FloatingToolbarProps): ReactElement | null {
  if (!anchorRect || !isFloatingToolbarVisible(toolbarProps.selection)) {
    return null;
  }

  const fittedToolbarSize = {
    ...toolbarSize,
    width: Math.min(toolbarSize.width, Math.max(0, viewport.width - 16)),
  };
  const position = calculateFloatingToolbarPosition(
    anchorRect,
    fittedToolbarSize,
    viewport,
  );

  return (
    <div
      className="crucialy-floating-toolbar"
      data-visible="true"
      style={{
        left: position.left,
        position: "fixed",
        top: position.top,
        width: fittedToolbarSize.width,
        zIndex: 1000,
      }}
    >
      <FixedToolbar {...toolbarProps} />
    </div>
  );
}
