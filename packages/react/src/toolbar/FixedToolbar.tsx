import {
  createDefaultCommandRegistry,
  type CommandRegistry,
  type DocumentNode,
  type RangeSelection,
} from "@crucialy-rich/core";
import { useMemo, type ReactElement } from "react";

import { createDefaultToolbarItems } from "./defaults";
import { resolveToolbarItems } from "./state";
import { Toolbar } from "./Toolbar";
import type { ResolvedToolbarCommandItem, ToolbarItem } from "./types";

const defaultToolbarRegistry = createDefaultCommandRegistry();
const defaultToolbarItems = createDefaultToolbarItems();

export interface FixedToolbarProps {
  className?: string;
  document: DocumentNode;
  items?: readonly ToolbarItem[];
  label?: string;
  onCommand?: (item: ResolvedToolbarCommandItem) => void;
  registry?: CommandRegistry;
  selection?: RangeSelection;
}

export function FixedToolbar({
  className,
  document,
  items = defaultToolbarItems,
  label = "固定格式工具栏",
  onCommand,
  registry = defaultToolbarRegistry,
  selection,
}: FixedToolbarProps): ReactElement {
  const resolvedItems = useMemo(
    () =>
      resolveToolbarItems(
        items,
        registry,
        selection ? { document, selection } : { document },
      ),
    [document, items, registry, selection],
  );

  return (
    <Toolbar
      items={resolvedItems}
      label={label}
      {...(className ? { className } : {})}
      {...(onCommand ? { onCommand } : {})}
    />
  );
}
