// @vitest-environment jsdom
import { createDocument, createParagraph, createText } from "@crucialy-rich/core";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { mountToolbar } from "./toolbar-fixture";

const value = createDocument([createParagraph([createText("前文后文")])]);
const original = {
  anchor: { path: [0, 0], offset: 0 },
  focus: { path: [0, 0], offset: 1 },
};
const current = {
  anchor: { path: [0, 0], offset: 2 },
  focus: { path: [0, 0], offset: 3 },
};

describe("Toolbar native event guards", () => {
  it.each(["middle", "right", "secondary-pointer", "canceled"])(
    "does not capture a %s press",
    (mode) => {
      const onCommand = vi.fn();
      const host = mountToolbar({ document: value, selection: original, onCommand });
      const event = new MouseEvent("pointerdown", {
        bubbles: true,
        cancelable: true,
        button: mode === "right" ? 2 : mode === "middle" ? 1 : 0,
      });
      if (mode === "secondary-pointer")
        Object.defineProperty(event, "isPrimary", { value: false });
      if (mode === "canceled") event.preventDefault();
      act(() => host.button().dispatchEvent(event));
      expect(event.defaultPrevented).toBe(mode === "canceled");
      host.rerender({ selection: current });
      host.click();
      expect(onCommand.mock.calls[0]![0].selection).toEqual(current);
    },
  );

  it("honors a canceled native click and releases its old pointer snapshot", () => {
    const onCommand = vi.fn();
    const host = mountToolbar({ document: value, selection: original, onCommand });
    host.press();
    host
      .button()
      .addEventListener("click", (event) => event.preventDefault(), { once: true });
    host.click();
    expect(onCommand).not.toHaveBeenCalled();
    host.rerender({ selection: current });
    host.click();
    expect(onCommand.mock.calls[0]![0].selection).toEqual(current);
  });

  it("does not execute a middle-button click", () => {
    const onCommand = vi.fn();
    const host = mountToolbar({ document: value, selection: original, onCommand });
    act(() =>
      host
        .button()
        .dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true, button: 1 }),
        ),
    );
    expect(onCommand).not.toHaveBeenCalled();
  });
});
