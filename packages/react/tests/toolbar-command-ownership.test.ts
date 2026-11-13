// @vitest-environment jsdom
import {
  createCommandRegistry,
  createCommandSuccess,
  createDocument,
  createParagraph,
  createText,
} from "@crucialy-rich/core";
import { describe, expect, it, vi } from "vitest";
import { type ToolbarItem } from "../src";
import { mountToolbar } from "./toolbar-fixture";

const value = createDocument([createParagraph([createText("正文")])]);
const selection = {
  anchor: { path: [0, 0], offset: 0 },
  focus: { path: [0, 0], offset: 1 },
};
const makeRegistry = () =>
  createCommandRegistry(
    ["first", "second"].map((name) => ({
      name,
      execute: () => createCommandSuccess(name),
    })),
  );
const first = {
  type: "command" as const,
  id: "first",
  commandName: "first",
  label: "第一个",
  payload: { value: 1 },
};

describe("Toolbar pending command ownership", () => {
  it.each(["id", "commandName", "payload", "registry"])(
    "cancels a pending press after %s changes",
    (field) => {
      const registry = makeRegistry();
      const onCommand = vi.fn();
      const host = mountToolbar({
        document: value,
        selection,
        items: [first],
        registry,
        onCommand,
      });
      host.press();
      const changed = {
        ...first,
        ...(field === "id" ? { id: "changed" } : {}),
        ...(field === "commandName" ? { commandName: "second" } : {}),
        ...(field === "payload" ? { payload: { value: 2 } } : {}),
      };
      host.rerender({
        items: [changed],
        registry: field === "registry" ? makeRegistry() : registry,
      });
      host.click();
      expect(onCommand).not.toHaveBeenCalled();
      host.press();
      host.click();
      expect(onCommand).toHaveBeenCalledTimes(1);
      expect(onCommand.mock.calls[0]![0].result.ok).toBe(true);
    },
  );

  it("does not apply one button's pending range to a different command", () => {
    const onCommand = vi.fn();
    const items: ToolbarItem[] = [
      first,
      { ...first, id: "second", commandName: "second" },
    ];
    const host = mountToolbar({
      document: value,
      selection,
      items,
      registry: makeRegistry(),
      onCommand,
    });
    host.press(0);
    host.click(1);
    expect(onCommand).not.toHaveBeenCalled();
    host.click(1);
    expect(onCommand).toHaveBeenCalledTimes(1);
  });

  it("does not cancel a pending press for a presentation-only update", () => {
    const onCommand = vi.fn();
    const host = mountToolbar({
      document: value,
      selection,
      items: [first],
      registry: makeRegistry(),
      onCommand,
    });
    host.press();
    host.rerender({ items: [{ ...first, label: "新名称" }], className: "new-class" });
    host.click();
    expect(onCommand).toHaveBeenCalledTimes(1);
  });
});
