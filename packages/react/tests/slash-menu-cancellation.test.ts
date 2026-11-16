// @vitest-environment jsdom
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { mountSlash, slashItems } from "./slash-interaction-fixture";

describe("Slash native cancellation", () => {
  it("does not execute a host-canceled click and allows a later selection", () => {
    const host = mountSlash();
    host
      .button()
      .addEventListener("click", (event) => event.preventDefault(), { once: true });
    host.click();
    expect(host.onSelect).not.toHaveBeenCalled();
    host.click();
    expect(host.onSelect).toHaveBeenCalledExactlyOnceWith(slashItems[0]);
  });

  it("does not recancel a pointer event already owned by the host", () => {
    const host = mountSlash();
    const event = new MouseEvent("pointerdown", { bubbles: true, cancelable: true });
    event.preventDefault();
    const prevent = vi.spyOn(event, "preventDefault");
    act(() => host.button().dispatchEvent(event));
    expect(prevent).not.toHaveBeenCalled();
    expect(host.onSelect).not.toHaveBeenCalled();
  });
});
