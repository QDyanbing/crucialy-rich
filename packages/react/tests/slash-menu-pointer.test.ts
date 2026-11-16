// @vitest-environment jsdom
import { act } from "react";
import { describe, expect, it } from "vitest";
import { mountSlash, slashItems } from "./slash-interaction-fixture";

describe("Slash pointer ownership", () => {
  it.each(["middle", "right", "secondary"])("does not cancel a %s pointer", (kind) => {
    const host = mountSlash();
    const event = new MouseEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      button: kind === "middle" ? 1 : kind === "right" ? 2 : 0,
    });
    if (kind === "secondary")
      Object.defineProperty(event, "isPrimary", { value: false });
    act(() => host.button().dispatchEvent(event));
    expect(event.defaultPrevented).toBe(false);
    expect(host.onSelect).not.toHaveBeenCalled();
  });

  it("preserves focus on an ordinary primary press", () => {
    const host = mountSlash();
    const input = document.createElement("input");
    document.body.append(input);
    input.focus();
    const event = new MouseEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      button: 0,
    });
    act(() => host.button().dispatchEvent(event));
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(input);
  });

  it("does not select from a middle-button click", () => {
    const host = mountSlash();
    act(() =>
      host
        .button()
        .dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true, button: 1 }),
        ),
    );
    expect(host.onSelect).not.toHaveBeenCalled();
  });

  it("allows the label but does not claim a descendant input", () => {
    const host = mountSlash();
    const input = document.createElement("input");
    host.button().append(input);
    act(() => input.click());
    expect(host.onSelect).not.toHaveBeenCalled();
    act(() => host.button().querySelector<HTMLElement>("span")!.click());
    expect(host.onSelect).toHaveBeenCalledExactlyOnceWith(slashItems[0]);
  });
});
