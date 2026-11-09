import {
  createDefaultCommandRegistry,
  createDocument,
  createParagraph,
  createText,
  SET_HEADING_COMMAND_NAME,
} from "@crucialy-rich/core";
import { describe, expect, it } from "vitest";
import { executeSlashCommand } from "../src";

const item = {
  id: "heading",
  label: "二级标题",
  commandName: SET_HEADING_COMMAND_NAME,
  payload: { level: 2 },
};
const makeTrigger = () => ({
  text: "/h",
  query: "h",
  range: { anchor: { path: [0, 0], offset: 0 }, focus: { path: [0, 0], offset: 2 } },
});
const document = createDocument([createParagraph([createText("/h正文")])]);

describe("Slash execution trigger snapshots", () => {
  it.each([true, false])("isolates the returned trigger on success=%s", (success) => {
    const trigger = makeTrigger();
    const before = structuredClone(trigger);
    const registry = createDefaultCommandRegistry();
    const event = executeSlashCommand(
      success ? item : { ...item, commandName: "missing" },
      registry,
      { document },
      trigger,
    );
    expect(event.result.ok).toBe(success);
    trigger.range.anchor.path[0] = 99;
    trigger.query = "changed";
    expect(event.trigger).toEqual(before);
    event.trigger.range.focus.offset = 99;
    expect(trigger.range.focus.offset).toBe(2);
  });

  it("captures the trigger before a target command can modify the caller's copy", () => {
    const trigger = makeTrigger();
    const before = structuredClone(trigger);
    const registry = createDefaultCommandRegistry();
    const original = registry.get(item.commandName)!;
    registry.register({
      ...original,
      execute(input) {
        trigger.range.anchor.path[0] = 99;
        trigger.text = "changed";
        return original.execute(input);
      },
    });
    const event = executeSlashCommand(item, registry, { document }, trigger);
    expect(event.result.ok).toBe(true);
    expect(event.trigger).toEqual(before);
    expect(event.result.transaction!.operations[0]).toMatchObject({
      range: before.range,
    });
  });
});
