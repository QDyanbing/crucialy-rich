import {
  createDefaultCommandRegistry,
  type CommandRegistry,
  type DocumentNode,
  type RangeSelection,
} from "@crucialy-rich/core";
import { useEffect, useRef, type ReactElement } from "react";

import { createDefaultToolbarItems } from "./defaults";
import { executeToolbarCommand } from "./execute";
import { resolveToolbarItems } from "./state";
import { createToolbarSelectionSnapshot } from "./selection";
import { Toolbar } from "./Toolbar";
import type {
  ResolvedToolbarCommandItem,
  ToolbarCommandEvent,
  ToolbarItem,
} from "./types";

const defaultToolbarRegistry = createDefaultCommandRegistry();
const defaultToolbarItems = createDefaultToolbarItems();

export interface FixedToolbarProps {
  className?: string;
  document: DocumentNode;
  disabled?: boolean;
  items?: readonly ToolbarItem[];
  label?: string;
  onCommand?: (event: ToolbarCommandEvent) => void;
  registry?: CommandRegistry;
  selection?: RangeSelection;
}

export function FixedToolbar({
  className,
  document,
  disabled = false,
  items = defaultToolbarItems,
  label = "固定格式工具栏",
  onCommand,
  registry = defaultToolbarRegistry,
  selection,
}: FixedToolbarProps): ReactElement {
  const savedSelectionRef = useRef<{
    document: DocumentNode;
    item: { id: string; commandName: string; payload: unknown };
    registry: CommandRegistry;
    canceled: boolean;
    selection: RangeSelection | undefined;
  }>();
  const resolvedItems = resolveToolbarItems(
    items,
    registry,
    selection ? { document, selection } : { document },
  );

  useEffect(() => {
    if ((disabled || !onCommand) && savedSelectionRef.current) {
      savedSelectionRef.current.canceled = true;
    }
  }, [disabled, onCommand]);

  function handleCommandPointerDown(item: ResolvedToolbarCommandItem) {
    if (disabled || !onCommand) return;
    savedSelectionRef.current = {
      document,
      canceled: false,
      item: { id: item.id, commandName: item.commandName, payload: item.payload },
      registry,
      selection: createToolbarSelectionSnapshot(selection),
    };
  }

  function handleCommand(item: (typeof resolvedItems)[number]) {
    if (item.type !== "command") {
      return;
    }

    const saved = savedSelectionRef.current;
    savedSelectionRef.current = undefined;
    if (disabled || saved?.canceled) return;
    if (
      saved &&
      (saved.document !== document ||
        saved.registry !== registry ||
        saved.item.id !== item.id ||
        saved.item.commandName !== item.commandName ||
        saved.item.payload !== item.payload)
    )
      return;
    const commandSelection = saved ? saved.selection : selection;

    onCommand?.(
      executeToolbarCommand(
        item,
        registry,
        commandSelection ? { document, selection: commandSelection } : { document },
      ),
    );
  }

  return (
    <Toolbar
      disabled={disabled}
      items={resolvedItems}
      label={label}
      onCommandPointerDown={handleCommandPointerDown}
      onCommandCancel={() => {
        savedSelectionRef.current = undefined;
      }}
      {...(className ? { className } : {})}
      {...(onCommand ? { onCommand: handleCommand } : {})}
    />
  );
}
