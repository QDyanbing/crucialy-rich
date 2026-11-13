import { act, createElement, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach } from "vitest";
import { FixedToolbar, type FixedToolbarProps } from "../src";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const roots: ReturnType<typeof createRoot>[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) act(() => root.unmount());
  document.body.replaceChildren();
});

export function mountToolbar(initial: FixedToolbarProps, strict = false) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  let props = initial;
  function render() {
    const tree = createElement(FixedToolbar, props);
    act(() => root.render(strict ? createElement(StrictMode, null, tree) : tree));
  }
  render();
  function button(index = 0) {
    return container.querySelectorAll("button")[index]!;
  }
  return {
    container,
    button,
    rerender(next: Partial<FixedToolbarProps>) {
      props = { ...props, ...next };
      render();
    },
    replace(next: FixedToolbarProps) {
      props = next;
      render();
    },
    press(index = 0) {
      act(() =>
        button(index).dispatchEvent(
          new MouseEvent("pointerdown", { bubbles: true, cancelable: true }),
        ),
      );
    },
    click(index = 0) {
      act(() => button(index).click());
    },
    cancel(index = 0) {
      act(() =>
        button(index).dispatchEvent(new MouseEvent("pointercancel", { bubbles: true })),
      );
    },
    unmount() {
      const index = roots.indexOf(root);
      if (index >= 0) roots.splice(index, 1);
      act(() => root.unmount());
    },
  };
}
