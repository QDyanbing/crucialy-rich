// @vitest-environment jsdom
import {
  createDocument,
  createParagraph,
  createText,
  type CompositionState,
} from "@crucialy-rich/core";
import { describe, expect, it } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

const value = () => createDocument([createParagraph([createText("AB")])]);
const point = { path: [0, 0], offset: 1 };

describe("composition state notification ownership", () => {
  it("does not let an observer overwrite the internal session", () => {
    const host = mountDeletionEditor(value(), point, {
      onCompositionStateChange(state) {
        state.active = false;
        state.data = "污染";
        if (state.startSelection) state.startSelection.anchor.path[0] = 99;
        if (state.selection) state.selection.focus.offset = 99;
      },
    });
    host.compose("compositionstart");
    expect(host.editor.getAttribute("data-composing")).toBe("true");
    host.compose("compositionupdate", "中");
    expect(host.onTransaction).not.toHaveBeenCalled();
    host.compose("compositionend", "中文");
    expect(host.editor.textContent).toBe("A中文B");
    expect(host.editor.getAttribute("data-composing")).toBe("false");
    expect(host.onTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ inputType: "insertCompositionText" }),
    );
  });

  it("keeps old notification snapshots unchanged through later candidates and idle", () => {
    const states: CompositionState[] = [];
    const host = mountDeletionEditor(value(), point, {
      onCompositionStateChange: (state) => states.push(state),
    });
    host.compose("compositionstart");
    const first = structuredClone(states[0]);
    host.compose("compositionupdate", "候选");
    host.compose("compositionend", "确认");
    expect(states[0]).toEqual(first);
    expect(states.map((state) => state.active)).toEqual([true, true, false]);
    states[1]!.startSelection!.anchor.offset = 99;
    expect(states[0]).toEqual(first);
  });

  it("separates start and current selections within one notification", () => {
    const states: CompositionState[] = [];
    const host = mountDeletionEditor(value(), point, {
      onCompositionStateChange: (state) => states.push(state),
    });
    host.compose("compositionstart");
    states[0]!.selection!.anchor.path[0] = 99;
    expect(states[0]!.startSelection!.anchor).toEqual(point);
    host.compose("compositionend", "新");
    expect(host.editor.textContent).toBe("A新B");
  });
});
