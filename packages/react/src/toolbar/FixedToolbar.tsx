import {
  createDefaultCommandRegistry,
  type CommandRegistry,
  type DocumentNode,
  type RangeSelection,
} from "@crucialy-rich/core";
import { useMemo, type ReactElement } from "react";

import { createDefaultToolbarItems } from "./defaults";
import { executeToolbarCommand } from "./execute";
import { resolveToolbarItems } from "./state";
import { Toolbar } from "./Toolbar";
import type { ToolbarCommandEvent, ToolbarItem } from "./types";

const defaultToolbarRegistry = createDefaultCommandRegistry();
const defaultToolbarItems = createDefaultToolbarItems();

export interface FixedToolbarProps {
  className?: string;
  document: DocumentNode;
  items?: readonly ToolbarItem[];
  label?: string;
  onCommand?: (event: ToolbarCommandEvent) => void;
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

  function handleCommand(item: (typeof resolvedItems)[number]) {
    if (item.type !== "command") {
      return;
    }

    onCommand?.(
      executeToolbarCommand(
        item,
        registry,
        selection ? { document, selection } : { document },
      ),
    );
  }

  return (
    <Toolbar
      items={resolvedItems}
      label={label}
      {...(className ? { className } : {})}
      {...(onCommand ? { onCommand: handleCommand } : {})}
    />
  );
}
