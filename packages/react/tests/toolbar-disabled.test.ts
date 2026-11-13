// @vitest-environment jsdom
import { createDocument, createParagraph, createText } from "@crucialy-rich/core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FloatingToolbar } from "../src";
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

describe("Toolbar global disabled state", () => {
  it("disables all commands without changing their pressed state", () => {
    const onCommand = vi.fn();
    const host = mountToolbar({
      document: value,
      selection: original,
      disabled: true,
      onCommand,
    });
    expect(
      [...host.container.querySelectorAll("button")].every((button) => button.disabled),
    ).toBe(true);
    expect(host.button().getAttribute("aria-pressed")).toBe("false");
    host.press();
    host.click();
    expect(onCommand).not.toHaveBeenCalled();
  });

  it("does not revive an interrupted press after disable and re-enable", () => {
    const onCommand = vi.fn();
    const host = mountToolbar({ document: value, selection: original, onCommand });
    host.press();
    host.rerender({ disabled: true });
    host.rerender({ disabled: false, selection: current });
    host.click();
    expect(onCommand).not.toHaveBeenCalled();
    host.press();
    host.click();
    expect(onCommand.mock.calls[0]![0].selection).toEqual(current);
  });

  it("retains command-specific disabling after the global lock is removed", () => {
    const host = mountToolbar({ document: value, disabled: true });
    host.rerender({ disabled: false });
    expect(host.button().disabled).toBe(true);
  });

  it("does not retain a press while the command callback is removed", () => {
    const onCommand = vi.fn();
    const host = mountToolbar({ document: value, selection: original, onCommand });
    host.press();
    host.replace({ document: value, selection: current });
    host.rerender({ onCommand });
    host.click();
    expect(onCommand).not.toHaveBeenCalled();
    host.click();
    expect(onCommand.mock.calls[0]![0].selection).toEqual(current);
  });

  it("passes the global lock through FloatingToolbar during SSR", () => {
    const html = renderToStaticMarkup(
      createElement(FloatingToolbar, {
        document: value,
        selection: original,
        disabled: true,
        anchorRect: { bottom: 120, height: 20, left: 20, top: 100, width: 100 },
      }),
    );
    expect(html.match(/<button/gu)!.length).toBeGreaterThan(0);
    expect(html.match(/ disabled=""/gu)).toHaveLength(html.match(/<button/gu)!.length);
  });
});
