import {
  applyTransaction,
  createDeleteTextOperation,
  createTransaction,
  executeCommand,
  getBlockTextOffset,
  getPointAtBlockTextOffset,
  type CommandContext,
  type CommandRegistry,
  type CommandResult,
} from "@crucialy-rich/core";

import type { SlashCommandEvent, SlashCommandItem, SlashMenuTrigger } from "./types";

function createFailure(item: SlashCommandItem, reason: string): CommandResult {
  return {
    commandName: item.commandName,
    ok: false,
    reason,
    status: "failure",
  };
}

export function executeSlashCommand(
  item: SlashCommandItem,
  registry: CommandRegistry,
  context: CommandContext,
  trigger: SlashMenuTrigger,
): SlashCommandEvent {
  const [blockIndex] = trigger.range.anchor.path;
  const textOffset = getBlockTextOffset(context.document, trigger.range.anchor);

  if (blockIndex === undefined || textOffset === undefined) {
    return {
      item,
      result: createFailure(item, "Slash menu trigger is not a valid text range."),
      trigger,
    };
  }

  const deleteTransaction = createTransaction([
    createDeleteTextOperation(trigger.range),
  ]);

  try {
    const cleanDocument = applyTransaction(context.document, deleteTransaction);
    const point = getPointAtBlockTextOffset(cleanDocument, blockIndex, textOffset, {
      affinity: "forward",
    });

    if (!point) {
      return {
        item,
        result: createFailure(
          item,
          "Slash menu selection cannot be restored after trigger cleanup.",
        ),
        trigger,
      };
    }

    const result = executeCommand(registry, item.commandName, {
      context: {
        document: cleanDocument,
        selection: {
          anchor: point,
          focus: { offset: point.offset, path: [...point.path] },
        },
      },
      payload: item.payload,
    });

    if (!result.ok || !result.transaction) {
      return { item, result, trigger };
    }

    return {
      item,
      result: {
        ...result,
        transaction: createTransaction([
          ...deleteTransaction.operations,
          ...result.transaction.operations,
        ]),
      },
      trigger,
    };
  } catch {
    return {
      item,
      result: createFailure(item, "Slash menu trigger cleanup failed."),
      trigger,
    };
  }
}
