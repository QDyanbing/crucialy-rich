// @vitest-environment jsdom
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { mountInteractionEditor } from "./editor-interaction-fixture";

describe("editor click lifecycle", () => {
  it.each(["task", "nested-editor"])(
    "does not restore a text range over a focused %s",
    (kind) => {
      const host = mountInteractionEditor();
      const control =
        kind === "task"
          ? host.target('input[type="checkbox"]')
          : document.createElement("div");
      if (kind === "nested-editor") {
        control.tabIndex = 0;
        control.setAttribute("data-crucialy-rich-editor", "true");
        host.editor.append(control);
      }
      control.focus();
      const restore = vi.spyOn(window.getSelection()!, "setBaseAndExtent");
      try {
        host.rerender({
          value: structuredClone(host.value),
          selection: {
            anchor: { path: [0, 0], offset: 0 },
            focus: { path: [0, 0], offset: 2 },
          },
        });
        expect(restore).not.toHaveBeenCalled();
        expect(document.activeElement).toBe(control);
      } finally {
        restore.mockRestore();
      }
    },
  );

  it.each(["img", "td", "p"])("does not process readonly %s clicks", (selector) => {
    const onClick = vi.fn();
    const host = mountInteractionEditor({ contentEditable: false, onClick });
    host.click(selector);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(host.block).not.toHaveBeenCalled();
    expect(host.cell).not.toHaveBeenCalled();
    expect(host.onTransaction).not.toHaveBeenCalled();
  });

  it("disables readonly tasks and restores normal single-transaction toggles when editable", () => {
    const host = mountInteractionEditor({ contentEditable: false });
    const checkbox = host.target('input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox.disabled).toBe(true);
    host.click('input[type="checkbox"]');
    expect(host.onTransaction).not.toHaveBeenCalled();
    expect(checkbox.checked).toBe(false);
    host.rerender({ contentEditable: true });
    host.click('input[type="checkbox"]');
    expect(host.onTransaction).toHaveBeenCalledTimes(1);
    expect(checkbox.checked).toBe(true);
  });

  it("preserves readonly link defaults and the host's ability to cancel them", () => {
    const host = mountInteractionEditor({ contentEditable: false });
    const link = host.target("a");
    link.setAttribute("href", "#readonly");
    const first = new MouseEvent("click", { bubbles: true, cancelable: true });
    act(() => link.dispatchEvent(first));
    expect(first.defaultPrevented).toBe(false);
    host.rerender({ onClick: (event) => event.preventDefault() });
    const second = new MouseEvent("click", { bubbles: true, cancelable: true });
    act(() => link.dispatchEvent(second));
    expect(second.defaultPrevented).toBe(true);
  });

  it("uses current callbacks after a rerender without capturing an old host", () => {
    const previous = vi.fn(),
      latest = vi.fn();
    const host = mountInteractionEditor({ onBlockSelectionChange: previous });
    host.rerender({ onBlockSelectionChange: latest });
    host.click("img");
    expect(previous).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledExactlyOnceWith({ type: "block", path: [2] });
  });

  it("does not retain click listeners after unmount", () => {
    const onClick = vi.fn();
    const host = mountInteractionEditor({ onClick });
    const image = host.target("img");
    host.unmount();
    act(() => image.click());
    expect(onClick).not.toHaveBeenCalled();
    const next = mountInteractionEditor();
    next.click('input[type="checkbox"]');
    expect(next.onTransaction).toHaveBeenCalledTimes(1);
  });
});
