// @vitest-environment jsdom
import {
  createCommandRegistry,
  createCommandSuccess,
  createDocument,
  createParagraph,
  createText,
} from "@crucialy-rich/core";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FixedToolbar, defineToolbarItems, resolveToolbarItems } from "../src";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const roots: ReturnType<typeof createRoot>[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) act(() => root.unmount());
  document.body.replaceChildren();
});
const value = createDocument([createParagraph([createText("文字")])]);
const selection = {
  anchor: { path: [0, 0], offset: 0 },
  focus: { path: [0, 0], offset: 1 },
};
const items = defineToolbarItems([
  { id: "broken", commandName: "broken", label: "异常命令", type: "command" },
  { id: "healthy", commandName: "healthy", label: "可用命令", type: "command" },
]);

describe("toolbar extension failure isolation", () => {
  it.each(["guard", "active", "lookup"])(
    "disables only the affected item for a %s exception",
    (stage) => {
      const registry = createCommandRegistry([
        {
          name: "broken",
          execute: () => createCommandSuccess("broken"),
          canExecute: () => {
            if (stage === "guard") throw new Error("Guard failed.");
            return true;
          },
          isActive: () => {
            if (stage === "active") throw new Error("State failed.");
            return true;
          },
        },
        {
          name: "healthy",
          execute: () => createCommandSuccess("healthy"),
          isActive: () => true,
        },
      ]);
      const lookup = registry.get;
      registry.get = (name) => {
        if (stage === "lookup" && name === "broken") throw new Error("Lookup failed.");
        return lookup(name);
      };
      const resolved = resolveToolbarItems(items, registry, {
        document: value,
        selection,
      });
      expect(resolved[0]).toMatchObject({ state: { disabled: true, active: false } });
      expect(resolved[1]).toMatchObject({ state: { disabled: false, active: true } });
      const container = document.createElement("div");
      document.body.append(container);
      const root = createRoot(container);
      roots.push(root);
      const onCommand = vi.fn();
      act(() =>
        root.render(
          createElement(FixedToolbar, {
            document: value,
            selection,
            items,
            registry,
            onCommand,
          }),
        ),
      );
      const [broken, healthy] = Array.from(container.querySelectorAll("button"));
      expect(broken!.disabled).toBe(true);
      expect(broken!.getAttribute("aria-pressed")).toBe("false");
      expect(healthy!.disabled).toBe(false);
      expect(healthy!.getAttribute("aria-pressed")).toBe("true");
      act(() => broken!.click());
      expect(onCommand).not.toHaveBeenCalled();
      act(() => healthy!.click());
      expect(onCommand).toHaveBeenCalledTimes(1);
      expect(onCommand.mock.calls[0]![0].result.ok).toBe(true);
    },
  );

  it("returns failure if a guard starts throwing after the item rendered enabled", () => {
    let broken = false;
    const execute = vi.fn(() => createCommandSuccess("broken"));
    const registry = createCommandRegistry([
      {
        name: "broken",
        execute,
        canExecute: () => {
          if (broken) throw new Error("Guard changed.");
          return true;
        },
      },
    ]);
    const root = createRoot(document.body.appendChild(document.createElement("div")));
    roots.push(root);
    const onCommand = vi.fn();
    act(() =>
      root.render(
        createElement(FixedToolbar, {
          document: value,
          selection,
          items: items.slice(0, 1),
          registry,
          onCommand,
        }),
      ),
    );
    const button = document.querySelector("button")!;
    expect(button.disabled).toBe(false);
    broken = true;
    act(() => button.click());
    const event = onCommand.mock.calls[0]![0];
    expect(event.result).toMatchObject({
      ok: false,
      status: "failure",
      reason: "Guard changed.",
    });
    expect(event.result).not.toHaveProperty("transaction");
    expect(event.selection).toEqual(selection);
    expect(event.selection).not.toBe(selection);
    expect(execute).not.toHaveBeenCalled();
    expect(value.children[0]!.children[0]!.text).toBe("文字");
  });
});
