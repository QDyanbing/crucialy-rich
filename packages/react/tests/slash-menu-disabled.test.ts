// @vitest-environment jsdom
import { act, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FloatingSlashMenu } from "../src";
import { mountSlash } from "./slash-interaction-fixture";

describe("Slash menu disabled state", () => {
  it("disables every option while keeping the controlled selected item", () => {
    const host = mountSlash({ disabled: true, activeIndex: 1 });
    expect(
      [...host.container.querySelectorAll("button")].every((button) => button.disabled),
    ).toBe(true);
    expect(host.button(1).getAttribute("aria-selected")).toBe("true");
    expect(host.button().getAttribute("aria-disabled")).toBe("true");
    host.click();
    expect(host.onSelect).not.toHaveBeenCalled();
  });

  it("does not capture a disabled pointer and resumes after re-enabling", () => {
    const host = mountSlash({ disabled: true });
    const event = new MouseEvent("pointerdown", { bubbles: true, cancelable: true });
    act(() => host.button().dispatchEvent(event));
    expect(event.defaultPrevented).toBe(false);
    host.rerender({ disabled: false });
    host.click();
    expect(host.onSelect).toHaveBeenCalledTimes(1);
  });

  it("forwards disabled through the floating component during SSR", () => {
    const html = renderToStaticMarkup(
      createElement(FloatingSlashMenu, {
        items: [{ id: "one", commandName: "one", label: "菜单项" }],
        disabled: true,
        anchorRect: { top: 80, bottom: 100, left: 20 },
      }),
    );
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-disabled="true"');
  });
});
