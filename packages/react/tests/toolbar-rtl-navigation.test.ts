// @vitest-environment jsdom
import { createDocument, createParagraph, createText } from "@crucialy-rich/core";
import { describe, expect, it } from "vitest";
import { mountToolbar } from "./toolbar-fixture";

const value = createDocument([createParagraph([createText("正文")])]);
const selection = {
  anchor: { path: [0, 0], offset: 0 },
  focus: { path: [0, 0], offset: 1 },
};

describe("Toolbar RTL navigation", () => {
  it.each([
    [0, "ArrowRight", 8],
    [0, "ArrowLeft", 1],
    [5, "ArrowLeft", 7],
    [7, "ArrowRight", 5],
    [3, "Home", 0],
    [3, "End", 8],
  ] as const)("moves from %s with %s to %s", (from, key, to) => {
    const host = mountToolbar({ document: value, selection });
    host.container.querySelector<HTMLElement>('[role="toolbar"]')!.style.direction =
      "rtl";
    host.focus(from);
    host.key(from, key);
    expect(document.activeElement).toBe(host.button(to));
  });

  it("reads the current direction instead of keeping a stale render snapshot", () => {
    const host = mountToolbar({ document: value, selection });
    const toolbar = host.container.querySelector<HTMLElement>('[role="toolbar"]')!;
    toolbar.style.direction = "rtl";
    host.focus();
    host.key(0, "ArrowLeft");
    expect(document.activeElement).toBe(host.button(1));
    toolbar.style.direction = "ltr";
    host.key(1, "ArrowRight");
    expect(document.activeElement).toBe(host.button(2));
  });
});
