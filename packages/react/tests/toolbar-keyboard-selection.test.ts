// @vitest-environment jsdom
import { createDocument, createParagraph, createText } from "@crucialy-rich/core";
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

describe("Toolbar keyboard selection ownership", () => {
  it.each(["Enter", " "])(
    "uses current props after a %s keyboard activation starts",
    (key) => {
      const onCommand = vi.fn();
      const host = mountToolbar({ document: value, selection: original, onCommand });
      host.press();
      host.rerender({ selection: current });
      host.focus();
      expect(host.key(0, key).defaultPrevented).toBe(false);
      expect(onCommand).not.toHaveBeenCalled();
      host.click();
      expect(onCommand).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ selection: current }),
      );
    },
  );

  it.each([
    ["ArrowRight", 1],
    ["Home", 0],
    ["End", 8],
  ] as const)("releases an old pointer gesture before %s", (key, target) => {
    const onCommand = vi.fn();
    const host = mountToolbar({ document: value, selection: original, onCommand });
    host.press();
    host.rerender({ selection: current });
    host.focus();
    host.key(0, key);
    expect(onCommand).not.toHaveBeenCalled();
    host.click(target);
    expect(onCommand).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ selection: current }),
    );
  });

  it.each([false, true])(
    "leaves Tab default behavior intact with Shift=%s and clears the pending range",
    (shiftKey) => {
      const onCommand = vi.fn();
      const host = mountToolbar({ document: value, selection: original, onCommand });
      host.press();
      host.rerender({ selection: current });
      host.focus();
      expect(host.key(0, "Tab", { shiftKey }).defaultPrevented).toBe(false);
      expect(onCommand).not.toHaveBeenCalled();
      host.click(1);
      expect(onCommand).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ selection: current }),
      );
    },
  );
});
