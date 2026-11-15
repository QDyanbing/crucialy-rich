// @vitest-environment jsdom
import { createDocument, createParagraph, createText } from "@crucialy-rich/core";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { mountToolbar } from "./toolbar-fixture";

const value = createDocument([createParagraph([createText("正文")])]);
const selection = {
  anchor: { path: [0, 0], offset: 0 },
  focus: { path: [0, 0], offset: 1 },
};

describe("Toolbar focus ownership", () => {
  it.each(["input", "button", "span"])(
    "does not claim a focused descendant %s",
    (tag) => {
      const onCommand = vi.fn();
      const host = mountToolbar({ document: value, selection, onCommand });
      host.focus(2);
      const child = document.createElement(tag);
      child.tabIndex = 0;
      host.button(4).append(child);
      act(() => child.focus());
      const event = new KeyboardEvent("keydown", {
        key: "ArrowRight",
        bubbles: true,
        cancelable: true,
      });
      act(() => child.dispatchEvent(event));
      expect(event.defaultPrevented).toBe(false);
      expect(document.activeElement).toBe(child);
      expect(host.button(2).tabIndex).toBe(0);
      expect(host.button(4).tabIndex).toBe(-1);
      expect(onCommand).not.toHaveBeenCalled();
    },
  );

  it("does not navigate a button moved underneath a foreign toolbar root", () => {
    const host = mountToolbar({ document: value, selection });
    const foreign = document.createElement("div");
    foreign.setAttribute("role", "toolbar");
    const button = host.button();
    const toolbar = button.parentElement!;
    toolbar.append(foreign);
    foreign.append(button);
    try {
      act(() => button.focus());
      const event = new KeyboardEvent("keydown", {
        key: "ArrowRight",
        bubbles: true,
        cancelable: true,
      });
      act(() => button.dispatchEvent(event));
      expect(event.defaultPrevented).toBe(false);
      expect(document.activeElement).toBe(button);
    } finally {
      toolbar.insertBefore(button, toolbar.firstChild);
    }
  });

  it("does not share remembered focus or button refs between instances", () => {
    const left = mountToolbar({ document: value, selection });
    const right = mountToolbar({ document: value, selection });
    left.focus(2);
    right.focus();
    right.key(0, "ArrowRight");
    expect(document.activeElement).toBe(right.button(1));
    expect(left.button(2).tabIndex).toBe(0);
    expect(right.button(1).tabIndex).toBe(0);
  });
});
