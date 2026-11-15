// @vitest-environment jsdom
import {
  BOLD_COMMAND_NAME,
  createDefaultCommandRegistry,
  createDocument,
  createParagraph,
  createText,
} from "@crucialy-rich/core";
import { describe, expect, it, vi } from "vitest";
import { mountToolbar } from "./toolbar-fixture";

const value = createDocument([createParagraph([createText("正文")])]);
const selection = {
  anchor: { path: [0, 0], offset: 0 },
  focus: { path: [0, 0], offset: 1 },
};

describe("Toolbar Home and End", () => {
  for (const from of [0, 3, 8]) {
    it.each([
      ["Home", 0],
      ["End", 8],
    ] as const)(`moves from ${from} using %s`, (key, to) => {
      const onCommand = vi.fn();
      const host = mountToolbar({ document: value, selection, onCommand });
      host.focus(from);
      expect(host.key(from, key).defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(host.button(to));
      expect(onCommand).not.toHaveBeenCalled();
    });
  }

  it("skips a disabled first command for Home", () => {
    const registry = createDefaultCommandRegistry();
    registry.register({ ...registry.get(BOLD_COMMAND_NAME)!, canExecute: () => false });
    const host = mountToolbar({ document: value, selection, registry });
    host.focus(8);
    host.key(8, "Home");
    expect(document.activeElement).toBe(host.button(1));
  });
});
