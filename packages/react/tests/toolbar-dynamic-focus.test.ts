// @vitest-environment jsdom
import {
  BOLD_COMMAND_NAME,
  UNDERLINE_COMMAND_NAME,
  createDefaultCommandRegistry,
  createDocument,
  createParagraph,
  createText,
} from "@crucialy-rich/core";
import { describe, expect, it } from "vitest";
import { createDefaultToolbarItems } from "../src";
import { mountToolbar } from "./toolbar-fixture";

const value = createDocument([createParagraph([createText("正文", { bold: true })])]);
const selection = {
  anchor: { path: [0, 0], offset: 0 },
  focus: { path: [0, 0], offset: 1 },
};

describe("Toolbar focus through configuration updates", () => {
  it("keeps a focused ID and follows the latest order after a reorder", () => {
    const host = mountToolbar({ document: value, selection });
    host.focus(2);
    const focused = host.button(2);
    const commands = createDefaultToolbarItems().filter(
      (item) => item.type === "command",
    );
    host.rerender({ items: [commands[2]!, commands[0]!, commands[1]!] });
    expect(host.button()).toBe(focused);
    expect(host.button().tabIndex).toBe(0);
    host.key(0, "ArrowRight");
    expect(document.activeElement).toBe(host.button(1));
  });

  it("finds a new entry after mutable registry state disables the focused command", () => {
    const registry = createDefaultCommandRegistry();
    const host = mountToolbar({ document: value, selection, registry });
    host.focus(2);
    registry.register({
      ...registry.get(UNDERLINE_COMMAND_NAME)!,
      canExecute: () => false,
    });
    host.rerender({ label: "更新状态" });
    expect(host.button(2).disabled).toBe(true);
    expect(host.button().tabIndex).toBe(0);
    expect(host.key(2, "ArrowRight").defaultPrevented).toBe(false);
  });

  it("skips an initially disabled leading command", () => {
    const registry = createDefaultCommandRegistry();
    registry.register({ ...registry.get(BOLD_COMMAND_NAME)!, canExecute: () => false });
    const host = mountToolbar({ document: value, selection, registry });
    expect(host.button().tabIndex).toBe(-1);
    expect(host.button(1).tabIndex).toBe(0);
  });

  it("does not confuse command active state with keyboard focus", () => {
    const host = mountToolbar({ document: value, selection });
    host.focus(1);
    expect(host.button().getAttribute("aria-pressed")).toBe("true");
    expect(host.button(1).getAttribute("aria-pressed")).toBe("false");
    expect(host.button(1).tabIndex).toBe(0);
  });

  it("does not steal focus when an empty or disabled group becomes available", () => {
    const host = mountToolbar({ document: value, selection, items: [] });
    const external = document.createElement("input");
    document.body.append(external);
    external.focus();
    host.rerender({ items: createDefaultToolbarItems(), disabled: true });
    expect(host.container.querySelectorAll('button[tabindex="0"]')).toHaveLength(0);
    host.rerender({ disabled: false });
    expect(host.button().tabIndex).toBe(0);
    expect(document.activeElement).toBe(external);
  });

  it("wraps a one-command group without running the command", () => {
    const host = mountToolbar({
      document: value,
      selection,
      items: [createDefaultToolbarItems()[0]!],
    });
    host.focus();
    for (const key of ["ArrowLeft", "ArrowRight", "Home", "End"]) {
      expect(host.key(0, key).defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(host.button());
    }
  });
});
