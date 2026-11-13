// @vitest-environment jsdom
import {
  createCommandRegistry,
  createCommandSuccess,
  createDocument,
  createParagraph,
  createText,
} from "@crucialy-rich/core";
import { describe, expect, it } from "vitest";
import { mountToolbar } from "./toolbar-fixture";

const value = createDocument([createParagraph([createText("正文")])]);
const items = [
  { type: "command" as const, id: "custom", commandName: "custom", label: "自定义" },
];

describe("Toolbar mutable registry refresh", () => {
  it("resolves a command registered into the same registry on the next render", () => {
    const registry = createCommandRegistry();
    const host = mountToolbar({ document: value, items, registry });
    expect(host.button().disabled).toBe(true);
    registry.register({
      name: "custom",
      execute: () => createCommandSuccess("custom"),
    });
    host.rerender({ label: "已刷新" });
    expect(host.button().disabled).toBe(false);
  });

  it("refreshes guard and active state without changing document or selection references", () => {
    let enabled = true;
    let active = false;
    const registry = createCommandRegistry([
      {
        name: "custom",
        canExecute: () => enabled,
        isActive: () => active,
        execute: () => createCommandSuccess("custom"),
      },
    ]);
    const host = mountToolbar({ document: value, items, registry });
    expect(host.button().getAttribute("aria-pressed")).toBe("false");
    enabled = false;
    active = true;
    host.rerender({ label: "已刷新" });
    expect(host.button().disabled).toBe(true);
    expect(host.button().getAttribute("aria-pressed")).toBe("true");
  });

  it("reflects a broken replacement and its later repair in the same registry", () => {
    const registry = createCommandRegistry([
      { name: "custom", execute: () => createCommandSuccess("custom") },
    ]);
    const host = mountToolbar({ document: value, items, registry });
    registry.register({
      name: "custom",
      execute: () => createCommandSuccess("custom"),
      canExecute() {
        throw new Error("Guard failed.");
      },
    });
    host.rerender({ label: "异常" });
    expect(host.button().disabled).toBe(true);
    registry.register({
      name: "custom",
      execute: () => createCommandSuccess("custom"),
    });
    host.rerender({ label: "恢复" });
    expect(host.button().disabled).toBe(false);
  });
});
