// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FloatingSlashMenu, type FloatingSlashMenuProps } from "../src";
const slashItems = [
  { id: "heading", commandName: "setHeading", label: "标题" },
  { id: "quote", commandName: "toggleQuote", label: "引用" },
];

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const roots: ReturnType<typeof createRoot>[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) act(() => root.unmount());
  document.body.replaceChildren();
});
function mount() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  let props: FloatingSlashMenuProps = {
    items: slashItems,
    anchorRect: { top: 80, bottom: 100, left: 20 },
  };
  function render(next: Partial<FloatingSlashMenuProps> = {}) {
    props = { ...props, ...next };
    act(() => root.render(createElement(FloatingSlashMenu, props)));
  }
  render();
  const menu = container.firstElementChild as HTMLElement;
  Object.defineProperties(menu, {
    clientHeight: { value: 120 },
    clientTop: { value: 2 },
  });
  vi.spyOn(menu, "getBoundingClientRect").mockReturnValue(
    DOMRect.fromRect({ y: 100, width: 280, height: 124 }),
  );
  const options = menu.querySelectorAll<HTMLElement>('[role="option"]');
  return {
    container,
    menu,
    render,
    rect(index: number, top: number, height = 50) {
      vi.spyOn(options[index]!, "getBoundingClientRect").mockReturnValue(
        DOMRect.fromRect({ y: top, height, width: 260 }),
      );
    },
  };
}

describe("floating Slash active item scrolling", () => {
  it("scrolls a clipped lower option into its own viewport", () => {
    const host = mount();
    host.rect(1, 245);
    host.render({ activeIndex: 1 });
    expect(host.menu.scrollTop).toBe(73);
  });
  it("scrolls upward without changing the page or focus", () => {
    const host = mount();
    host.menu.scrollTop = 80;
    host.rect(0, 70, 40);
    const input = document.createElement("input");
    document.body.append(input);
    input.focus();
    const scroll = vi.spyOn(window, "scrollTo");
    host.render({ activeIndex: 0, items: [...slashItems] });
    expect(host.menu.scrollTop).toBe(48);
    expect(document.activeElement).toBe(input);
    expect(scroll).not.toHaveBeenCalled();
    scroll.mockRestore();
  });
  it("does not move an already visible item", () => {
    const host = mount();
    host.menu.scrollTop = 20;
    host.rect(1, 130);
    host.render({ activeIndex: 1 });
    expect(host.menu.scrollTop).toBe(20);
  });
  it.each([-1, 99, Number.NaN])("ignores invalid active index %s", (activeIndex) => {
    const host = mount();
    host.render({ activeIndex });
    expect(host.menu.scrollTop).toBe(0);
  });
  it("aligns the beginning of an oversized item instead of hiding its label", () => {
    const host = mount();
    host.rect(1, 190, 150);
    host.render({ activeIndex: 1 });
    expect(host.menu.scrollTop).toBe(88);
  });
  it("can hide and show without changing the hook order", () => {
    const host = mount();
    host.render({ anchorRect: null });
    expect(host.container.childElementCount).toBe(0);
    host.render({ anchorRect: { top: 80, bottom: 100, left: 20 } });
    expect(host.container.querySelectorAll('[role="option"]')).toHaveLength(2);
  });
});
