import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, vi } from "vitest";
import { SlashMenu, type SlashMenuProps } from "../src";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const roots: ReturnType<typeof createRoot>[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) act(() => root.unmount());
  document.body.replaceChildren();
});
export const slashItems = [
  { id: "heading", commandName: "setHeading", label: "标题" },
  { id: "quote", commandName: "toggleQuote", label: "引用" },
];
export function mountSlash(options: Partial<SlashMenuProps> = {}) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  const onSelect = vi.fn();
  let props: SlashMenuProps = { items: slashItems, onSelect, ...options };
  function render() {
    act(() => root.render(createElement(SlashMenu, props)));
  }
  render();
  const button = (index = 0) => container.querySelectorAll("button")[index]!;
  return {
    container,
    button,
    onSelect,
    rerender(next: Partial<SlashMenuProps>) {
      props = { ...props, ...next };
      render();
    },
    click(index = 0) {
      act(() => button(index).click());
    },
  };
}
