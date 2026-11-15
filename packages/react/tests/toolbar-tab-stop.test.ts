// @vitest-environment jsdom
import {
  BOLD_COMMAND_NAME,
  createDocument,
  createParagraph,
  createText,
} from "@crucialy-rich/core";
import { act } from "react";
import { describe, expect, it } from "vitest";
import { mountToolbar } from "./toolbar-fixture";

const value = createDocument([createParagraph([createText("正文")])]);
const selection = {
  anchor: { path: [0, 0], offset: 0 },
  focus: { path: [0, 0], offset: 1 },
};

describe("Toolbar roving Tab stop", () => {
  it("puts only the first enabled command in the Tab sequence", () => {
    const host = mountToolbar({ document: value, selection });
    expect(
      [...host.container.querySelectorAll("button")].map((button) => button.tabIndex),
    ).toEqual([0, -1, -1, -1, -1, -1, -1, -1, -1]);
    expect(document.activeElement).not.toBe(host.button());
  });

  it("remembers the last actually focused command without executing it", () => {
    const host = mountToolbar({ document: value, selection });
    act(() => host.button(2).focus());
    expect(host.button(2).tabIndex).toBe(0);
    expect(host.button().tabIndex).toBe(-1);
    expect(host.container.querySelectorAll('button[tabindex="0"]')).toHaveLength(1);
  });

  it("does not create a Tab stop when globally disabled or all commands lack a selection", () => {
    const host = mountToolbar({ document: value, selection, disabled: true });
    expect(host.container.querySelectorAll('button[tabindex="0"]')).toHaveLength(0);
    host.replace({ document: value });
    expect(host.container.querySelectorAll('button[tabindex="0"]')).toHaveLength(0);
  });

  it("falls back to the first enabled command after the focused item disappears", () => {
    const host = mountToolbar({ document: value, selection });
    act(() => host.button(2).focus());
    host.rerender({
      items: [
        { id: "bold", type: "command", commandName: BOLD_COMMAND_NAME, label: "加粗" },
      ],
    });
    expect(host.button().disabled).toBe(false);
    expect(host.button().tabIndex).toBe(0);
  });
});
