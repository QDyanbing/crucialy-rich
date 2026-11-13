import {
  createCommandRegistry,
  createCommandSuccess,
  createDocument,
  createParagraph,
  createText,
  type CommandContext,
} from "@crucialy-rich/core";
import { describe, expect, it } from "vitest";
import { executeToolbarCommand, type ResolvedToolbarCommandItem } from "../src";

const item: ResolvedToolbarCommandItem = {
  type: "command",
  id: "custom",
  commandName: "custom",
  label: "自定义",
  state: { active: false, disabled: false, registered: true, commandName: "custom" },
};

describe("Toolbar execution selection ownership", () => {
  it.each(["success", "failure", "skipped"])(
    "captures the original selection before %s extensions",
    (status) => {
      const context: CommandContext = {
        document: createDocument([createParagraph([createText("正文")])]),
        selection: {
          anchor: { path: [0, 0], offset: 2 },
          focus: { path: [0, 0], offset: 0 },
        },
      };
      const before = structuredClone(context.selection);
      const mutate = () => {
        context.selection!.anchor.path[0] = 99;
        context.selection!.focus.offset = 99;
      };
      const registry = createCommandRegistry([
        {
          name: "custom",
          canExecute() {
            if (status === "skipped") {
              mutate();
              return false;
            }
            return true;
          },
          execute() {
            mutate();
            if (status === "failure") throw new Error("Execution failed.");
            return createCommandSuccess("custom");
          },
        },
      ]);
      const event = executeToolbarCommand(item, registry, context);
      expect(event.result.status).toBe(status);
      expect(event.selection).toEqual(before);
      event.selection!.focus.path[0] = 88;
      expect(context.selection!.focus.path).toEqual([0, 0]);
    },
  );

  it("keeps an absent initial selection absent even if an extension supplies one", () => {
    const context: CommandContext = {
      document: createDocument([createParagraph([createText("正文")])]),
    };
    const registry = createCommandRegistry([
      {
        name: "custom",
        execute() {
          context.selection = {
            anchor: { path: [0, 0], offset: 0 },
            focus: { path: [0, 0], offset: 1 },
          };
          return createCommandSuccess("custom");
        },
      },
    ]);
    expect(executeToolbarCommand(item, registry, context)).not.toHaveProperty(
      "selection",
    );
  });
});
