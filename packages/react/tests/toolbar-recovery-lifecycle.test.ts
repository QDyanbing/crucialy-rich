// @vitest-environment jsdom
import {
  createCommandRegistry,
  createCommandSuccess,
  createDocument,
  createParagraph,
  createText,
  type CommandInput,
  type CommandContext,
} from "@crucialy-rich/core";
import { describe, expect, it, vi } from "vitest";
import { mountToolbar } from "./toolbar-fixture";

const value = createDocument([createParagraph([createText("前文后文")])]);
const original = {
  anchor: { path: [0, 0], offset: 0 },
  focus: { path: [0, 0], offset: 1 },
};
const current = {
  anchor: { path: [0, 0], offset: 3 },
  focus: { path: [0, 0], offset: 2 },
};
const items = [
  { id: "custom", commandName: "custom", label: "自定义", type: "command" as const },
];

describe("Toolbar recovery and lifecycle", () => {
  it.each(["lookup", "guard", "execute"])(
    "consumes the old gesture after a %s failure and retries at the current range",
    (stage) => {
      let broken = false;
      const registry = createCommandRegistry([
        {
          name: "custom",
          canExecute() {
            if (broken && stage === "guard") throw new Error("Guard failed.");
            return true;
          },
          execute() {
            if (broken && stage === "execute") throw new Error("Execution failed.");
            return createCommandSuccess("custom");
          },
        },
      ]);
      const get = registry.get;
      registry.get = (name) => {
        if (broken && stage === "lookup") throw new Error("Lookup failed.");
        return get(name);
      };
      const onCommand = vi.fn();
      const host = mountToolbar({
        document: value,
        selection: original,
        registry,
        items,
        onCommand,
      });
      host.press();
      host.rerender({ selection: current });
      broken = true;
      host.click();
      const first = onCommand.mock.calls[0]![0];
      expect(first.result.status).toBe("failure");
      expect(first.result).not.toHaveProperty("transaction");
      expect(first.selection).toEqual(original);
      broken = false;
      host.click();
      expect(onCommand.mock.calls[1]![0].selection).toEqual(current);
      expect(onCommand.mock.calls[1]![0].result.ok).toBe(true);
    },
  );

  it("does not borrow a newly supplied selection for a selection-free press", () => {
    const seen: CommandContext[] = [];
    const registry = createCommandRegistry([
      {
        name: "custom",
        execute(input: CommandInput) {
          seen.push(input.context);
          return createCommandSuccess("custom");
        },
      },
    ]);
    const host = mountToolbar({
      document: value,
      registry,
      items,
      onCommand: () => {},
    });
    host.press();
    host.rerender({ selection: current });
    host.click();
    expect(seen[0]).not.toHaveProperty("selection");
    host.click();
    expect(seen[1]!.selection).toEqual(current);
  });

  it("does not share pending ranges between two toolbars", () => {
    const first = vi.fn();
    const second = vi.fn();
    const left = mountToolbar({
      document: value,
      selection: original,
      onCommand: first,
    });
    const right = mountToolbar({
      document: value,
      selection: current,
      onCommand: second,
    });
    left.press();
    right.click();
    left.click();
    expect(first.mock.calls[0]![0].selection).toEqual(original);
    expect(second.mock.calls[0]![0].selection).toEqual(current);
  });

  it("keeps the saved range but uses the latest callback in StrictMode", () => {
    const first = vi.fn();
    const latest = vi.fn();
    const host = mountToolbar(
      { document: value, selection: original, onCommand: first },
      true,
    );
    host.press();
    host.rerender({ selection: current, onCommand: latest });
    host.click();
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ selection: original }),
    );
  });

  it("does not carry a pending gesture through unmount and remount", () => {
    const onCommand = vi.fn();
    const old = mountToolbar({ document: value, selection: original, onCommand });
    old.press();
    old.unmount();
    const next = mountToolbar({ document: value, selection: current, onCommand });
    next.click();
    expect(onCommand).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ selection: current }),
    );
  });
});
