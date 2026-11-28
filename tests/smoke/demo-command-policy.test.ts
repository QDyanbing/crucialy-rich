import {
  createCommandRegistry,
  createCommandSuccess,
  createDocument,
  createDefaultCommandRegistry,
  createParagraph,
  createText,
  BOLD_COMMAND_NAME,
} from "@crucialy-rich/core";
import { describe, expect, it, vi } from "vitest";
import { executeDemoCommand } from "../../apps/demo/src/command-policy";
describe("Demo command execution policy", () => {
  it("does not even look up a command while locked", () => {
    const registry = createCommandRegistry();
    const lookup = vi.spyOn(registry, "get");
    const result = executeDemoCommand(
      registry,
      "custom",
      { context: { document: createDocument() } },
      true,
    );
    expect(result.status).toBe("skipped");
    expect(result.transaction).toBeUndefined();
    expect(lookup).not.toHaveBeenCalled();
  });
  it("delegates unlocked input without changing its payload or result", () => {
    const result = createCommandSuccess("custom");
    const execute = vi.fn(() => result);
    const registry = createCommandRegistry([{ name: "custom", execute }]);
    const input = {
      context: { document: createDocument() },
      payload: { value: "自定义" },
    };
    expect(executeDemoCommand(registry, "custom", input, false)).toBe(result);
    expect(execute).toHaveBeenCalledWith(input);
  });
  it("allows normal execution after a lock is removed", () => {
    const document = createDocument([createParagraph([createText("正文")])]);
    const selection = {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 2 },
    };
    const input = { context: { document, selection } };
    const registry = createDefaultCommandRegistry();
    expect(executeDemoCommand(registry, BOLD_COMMAND_NAME, input, true).ok).toBe(false);
    expect(executeDemoCommand(registry, BOLD_COMMAND_NAME, input, false).ok).toBe(true);
    expect(document.children[0]).toEqual(createParagraph([createText("正文")]));
  });
});
