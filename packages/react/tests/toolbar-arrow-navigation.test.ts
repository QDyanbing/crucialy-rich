// @vitest-environment jsdom
import { createDocument, createParagraph, createText } from "@crucialy-rich/core";
import { describe, expect, it, vi } from "vitest";
import { mountToolbar } from "./toolbar-fixture";

const value = createDocument([createParagraph([createText("正文")])]);
const selection = {
  anchor: { path: [0, 0], offset: 0 },
  focus: { path: [0, 0], offset: 1 },
};

describe("Toolbar horizontal arrow navigation", () => {
  it.each([
    [0, "ArrowRight", 1],
    [1, "ArrowLeft", 0],
    [0, "ArrowLeft", 8],
    [8, "ArrowRight", 0],
    [5, "ArrowRight", 7],
    [7, "ArrowLeft", 5],
  ] as const)("moves %s with %s to %s without a command", (from, key, to) => {
    const onCommand = vi.fn();
    const host = mountToolbar({ document: value, selection, onCommand });
    host.focus(from);
    expect(host.key(from, key).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(host.button(to));
    expect(host.button(to).tabIndex).toBe(0);
    expect(host.container.querySelectorAll('button[tabindex="0"]')).toHaveLength(1);
    expect(onCommand).not.toHaveBeenCalled();
  });

  it("does not claim unsupported keys", () => {
    const host = mountToolbar({ document: value, selection });
    host.focus();
    for (const key of ["ArrowUp", "ArrowDown", "a", "Backspace"])
      expect(host.key(0, key).defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(host.button());
  });
});
