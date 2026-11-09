// @vitest-environment jsdom
import { act, createElement, StrictMode } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SlashMenu } from "../src";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const roots: Root[] = [];
const items = [
  { id: "heading", commandName: "setHeading", label: "标题" },
  { id: "quote", commandName: "toggleQuote", label: "引用" },
];
function container() {
  const element = document.createElement("div");
  document.body.append(element);
  return element;
}
function ids(element: HTMLElement) {
  return [...element.querySelectorAll('[role="option"]')].map((option) => option.id);
}
afterEach(() => {
  for (const root of roots.splice(0)) act(() => root.unmount());
  document.body.replaceChildren();
});

describe("Slash menu lifecycle", () => {
  it("hydrates reused configurations with stable unique instance IDs", async () => {
    const element = container();
    const tree = createElement(
      StrictMode,
      null,
      createElement(SlashMenu, { items, label: "左菜单" }),
      createElement(SlashMenu, { items, label: "右菜单" }),
    );
    element.innerHTML = renderToString(tree);
    const before = ids(element);
    const onRecoverableError = vi.fn();
    await act(async () => {
      roots.push(hydrateRoot(element, tree, { onRecoverableError }));
    });
    expect(ids(element)).toEqual(before);
    expect(new Set(before).size).toBe(4);
    expect(onRecoverableError).not.toHaveBeenCalled();
  });

  it("keeps IDs stable while updating the active item and filtering", () => {
    const element = container();
    const root = createRoot(element);
    roots.push(root);
    act(() => root.render(createElement(SlashMenu, { items })));
    const before = ids(element);
    act(() => root.render(createElement(SlashMenu, { items, activeIndex: 1 })));
    expect(ids(element)).toEqual(before);
    expect(element.querySelector('[aria-selected="true"]')!.textContent).toBe("引用");
    act(() => root.render(createElement(SlashMenu, { items: [items[0]!] })));
    expect(ids(element)).toEqual([before[0]]);
  });

  it("prevents pointer focus transfer and selects only the clicked instance", () => {
    const input = document.createElement("input");
    document.body.append(input);
    const element = container();
    const first = vi.fn();
    const second = vi.fn();
    const root = createRoot(element);
    roots.push(root);
    act(() =>
      root.render(
        createElement(
          "div",
          null,
          createElement(SlashMenu, { items, onSelect: first }),
          createElement(SlashMenu, { items, onSelect: second }),
        ),
      ),
    );
    input.focus();
    const option = element.querySelectorAll("button")[3]!;
    const pointer = new MouseEvent("pointerdown", { bubbles: true, cancelable: true });
    act(() => option.dispatchEvent(pointer));
    expect(pointer.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(input);
    act(() => option.click());
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledExactlyOnceWith(items[1]);
  });

  it("uses the latest callback in StrictMode and detaches it on unmount", () => {
    const element = container();
    const root = createRoot(element);
    const first = vi.fn();
    const latest = vi.fn();
    const tree = (onSelect: typeof first) =>
      createElement(StrictMode, null, createElement(SlashMenu, { items, onSelect }));
    act(() => root.render(tree(first)));
    act(() => root.render(tree(latest)));
    const option = element.querySelector("button")!;
    act(() => option.click());
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledExactlyOnceWith(items[0]);
    act(() => root.unmount());
    act(() => option.click());
    expect(latest).toHaveBeenCalledTimes(1);
  });
});
