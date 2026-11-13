// @vitest-environment jsdom
import { createDocument, createParagraph, createText } from "@crucialy-rich/core";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { mountToolbar } from "./toolbar-fixture";
import { Toolbar, type ResolvedToolbarCommandItem } from "../src";

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
  it("releases a previous snapshot when the next pointer press was canceled", () => {
    const onCommand = vi.fn();
    const host = mountToolbar({ document: value, selection: original, onCommand });
    host.press();
    host.button().addEventListener("pointerdown", (event) => event.preventDefault(), {
      once: true,
    });
    host.press();
    host.rerender({ selection: current });
    host.click();
    expect(onCommand.mock.calls[0]![0].selection).toEqual(current);
  });

  it.each(["global", "item"])(
    "does not notify low-level pointer capture under a %s lock",
    (mode) => {
      const container = document.createElement("div");
      document.body.append(container);
      const root = createRoot(container);
      const onCommandPointerDown = vi.fn();
      const item: ResolvedToolbarCommandItem = {
        id: "custom",
        commandName: "custom",
        label: "自定义",
        type: "command",
        state: {
          commandName: "custom",
          registered: true,
          active: false,
          disabled: mode === "item",
        },
      };
      try {
        act(() =>
          root.render(
            createElement(Toolbar, {
              items: [item],
              disabled: mode === "global",
              onCommandPointerDown,
            }),
          ),
        );
        act(() =>
          container.querySelector("button")!.dispatchEvent(
            new MouseEvent("pointerdown", {
              bubbles: true,
              cancelable: true,
              button: 0,
            }),
          ),
        );
        expect(onCommandPointerDown).not.toHaveBeenCalled();
      } finally {
        act(() => root.unmount());
      }
    },
  );

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
