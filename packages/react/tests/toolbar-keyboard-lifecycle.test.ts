// @vitest-environment jsdom
import { act, createElement, StrictMode } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Toolbar, type ResolvedToolbarCommandItem } from "../src";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const roots: Root[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) act(() => root.unmount());
  document.body.replaceChildren();
});
const items: ResolvedToolbarCommandItem[] = ["first", "second", "third"].map((id) => ({
  id,
  commandName: id,
  label: id,
  type: "command",
  state: { commandName: id, active: false, disabled: false, registered: true },
}));
function container() {
  const element = document.createElement("div");
  document.body.append(element);
  return element;
}

describe("Toolbar keyboard lifecycle", () => {
  it("hydrates two toolbar groups without changing server tab stops", async () => {
    const element = container();
    const tree = createElement(
      StrictMode,
      null,
      createElement(Toolbar, { items, label: "左工具栏" }),
      createElement(Toolbar, { items, label: "右工具栏" }),
    );
    element.innerHTML = renderToString(tree);
    const before = [...element.querySelectorAll("button")].map(
      (button) => button.tabIndex,
    );
    const onRecoverableError = vi.fn();
    await act(async () => {
      roots.push(hydrateRoot(element, tree, { onRecoverableError }));
    });
    expect(
      [...element.querySelectorAll("button")].map((button) => button.tabIndex),
    ).toEqual(before);
    expect(before).toEqual([0, -1, -1, 0, -1, -1]);
    const buttons = element.querySelectorAll("button");
    act(() => buttons[3]!.focus());
    act(() =>
      buttons[3]!.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "ArrowRight",
          bubbles: true,
          cancelable: true,
        }),
      ),
    );
    expect(document.activeElement).toBe(buttons[4]);
    expect(buttons[0]!.tabIndex).toBe(0);
    expect(buttons[4]!.tabIndex).toBe(0);
    expect(onRecoverableError).not.toHaveBeenCalled();
  });

  it("uses current callbacks in StrictMode without double keyboard cancellation", () => {
    const element = container();
    const root = createRoot(element);
    roots.push(root);
    const first = vi.fn(),
      latest = vi.fn(),
      command = vi.fn();
    const render = (onCommandCancel: typeof first) =>
      act(() =>
        root.render(
          createElement(
            StrictMode,
            null,
            createElement(Toolbar, { items, onCommandCancel, onCommand: command }),
          ),
        ),
      );
    render(first);
    render(latest);
    const button = element.querySelector("button")!;
    act(() => button.focus());
    act(() =>
      button.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "ArrowRight",
          bubbles: true,
          cancelable: true,
        }),
      ),
    );
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledExactlyOnceWith(items[0]);
    expect(command).not.toHaveBeenCalled();
  });

  it("detaches keyboard handlers and resets remembered focus on remount", () => {
    const element = container();
    const root = createRoot(element);
    const cancel = vi.fn();
    act(() => root.render(createElement(Toolbar, { items, onCommandCancel: cancel })));
    const last = element.querySelectorAll("button")[2]!;
    act(() => last.focus());
    act(() => root.unmount());
    act(() =>
      last.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Home", bubbles: true, cancelable: true }),
      ),
    );
    expect(cancel).not.toHaveBeenCalled();
    const next = createRoot(element);
    roots.push(next);
    act(() => next.render(createElement(Toolbar, { items })));
    expect(
      [...element.querySelectorAll("button")].map((button) => button.tabIndex),
    ).toEqual([0, -1, -1]);
  });
});
