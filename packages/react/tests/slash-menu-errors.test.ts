import { describe, expect, it, vi } from "vitest";
import {
  applyTransaction,
  createDefaultCommandRegistry,
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createParagraph,
  createText,
  recordHistory,
  redoHistory,
  SET_HEADING_COMMAND_NAME,
  undoHistory,
} from "@crucialy-rich/core";
import { executeSlashCommand } from "../src";

const document = createDocument([createParagraph([createText("/h正文")])]);
const trigger = {
  query: "h",
  text: "/h",
  range: { anchor: { path: [0, 0], offset: 0 }, focus: { path: [0, 0], offset: 2 } },
};
const item = {
  id: "heading",
  label: "二级标题",
  commandName: SET_HEADING_COMMAND_NAME,
  payload: { level: 2 },
};

describe("Slash command extension failures", () => {
  it.each(["guard", "execute", "lookup"])(
    "does not expose trigger cleanup after a %s exception",
    (stage) => {
      const registry = createDefaultCommandRegistry();
      const original = registry.get(SET_HEADING_COMMAND_NAME)!;
      const execute = vi.fn(() => {
        throw new Error("Target execution failed.");
      });
      registry.register({
        ...original,
        execute,
        canExecute: () => {
          if (stage === "guard") throw new Error("Target guard failed.");
          return true;
        },
      });
      const broken =
        stage === "lookup"
          ? {
              ...registry,
              get: () => {
                throw new Error("Target lookup failed.");
              },
            }
          : registry;
      const before = structuredClone(document);
      const event = executeSlashCommand(
        item,
        broken,
        { document, selection: trigger.range },
        trigger,
      );
      expect(event.result).toMatchObject({
        ok: false,
        status: "failure",
        reason: `Target ${stage === "execute" ? "execution" : stage} failed.`,
      });
      expect(event.result).not.toHaveProperty("transaction");
      expect(event.result).not.toHaveProperty("selection");
      expect(document).toEqual(before);
      if (stage !== "execute") expect(execute).not.toHaveBeenCalled();
    },
  );

  it("keeps an ordinary disabled command skipped without a cleanup transaction", () => {
    const registry = createDefaultCommandRegistry();
    registry.register({
      ...registry.get(SET_HEADING_COMMAND_NAME)!,
      canExecute: () => false,
    });
    const event = executeSlashCommand(item, registry, { document }, trigger);
    expect(event.result.status).toBe("skipped");
    expect(event.result).not.toHaveProperty("transaction");
  });

  it("can retry successfully and records cleanup with the target as one History edit", () => {
    const registry = createDefaultCommandRegistry();
    const original = registry.get(SET_HEADING_COMMAND_NAME)!;
    registry.register({
      ...original,
      canExecute: () => {
        throw new Error("Temporary failure.");
      },
    });
    expect(executeSlashCommand(item, registry, { document }, trigger).result.ok).toBe(
      false,
    );
    registry.register(original);
    const result = executeSlashCommand(item, registry, { document }, trigger).result;
    expect(result.transaction!.operations.map((operation) => operation.type)).toEqual([
      "delete_text",
      "set_block_type",
    ]);
    const after = applyTransaction(document, result.transaction!);
    expect(after.children[0]).toMatchObject({
      type: "heading",
      level: 2,
      children: [createText("正文")],
    });
    const history = recordHistory({
      history: createHistoryState(),
      transaction: result.transaction!,
      before: createHistorySnapshot(document, trigger.range),
      after: createHistorySnapshot(after, result.selection),
    });
    expect(history.undoStack).toHaveLength(1);
    const undone = undoHistory(history)!;
    expect(undone.document).toEqual(document);
    expect(undone.selection).toEqual(trigger.range);
    expect(redoHistory(undone.history)!.document).toEqual(after);
  });
});
